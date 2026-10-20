import { HttpError } from './http.js';

const DAY_MS = 86_400_000;

// Three tiers, ordered from safest to most destructive. The numbers are policy,
// not physics: they live here so the endpoint, the script and the dashboard
// cannot drift apart.
export const GHOST_POLICY = { orphanDays: 30, dormantDays: 180, tombstoneDays: 30, unownedDays: 30 };

// An orphan never had content or a relationship. Deleting it loses nothing.
const ORPHAN = `deleted_at IS NULL
  AND created_at < ?
  AND (last_seen_at IS NULL OR last_seen_at < ?)
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.owner_hash = accounts.owner_hash)
  AND NOT EXISTS (SELECT 1 FROM friendships f WHERE f.owner_a = accounts.owner_hash OR f.owner_b = accounts.owner_hash)`;

// A dormant identity still has something worth keeping, but no device has
// presented its credential for a long time. It is tombstoned, not deleted.
const DORMANT = `deleted_at IS NULL
  AND COALESCE(last_seen_at, created_at) < ?
  AND (EXISTS (SELECT 1 FROM profiles p WHERE p.owner_hash = accounts.owner_hash)
    OR EXISTS (SELECT 1 FROM friendships f WHERE f.owner_a = accounts.owner_hash OR f.owner_b = accounts.owner_hash))`;

// A tombstone has already had its grace period; now the row itself can go.
const EXPIRED = 'deleted_at IS NOT NULL AND deleted_at < ?';

// A portrait with no identity at all. Uploads require an identity now, so these
// can only come from the old implicit-registration window or a rollback. They are
// unrecoverable (no key opens them) and the account walk above cannot see them.
const UNOWNED_PROFILE = `deleted_at IS NULL AND created_at < ?
  AND NOT EXISTS (SELECT 1 FROM accounts a WHERE a.owner_hash = profiles.owner_hash)`;

function policy(overrides = {}) {
  const merged = { ...GHOST_POLICY };
  for (const key of Object.keys(GHOST_POLICY)) {
    const value = overrides[key];
    if (value === undefined) continue;
    if (!Number.isSafeInteger(value) || value < 1 || value > 3650) throw new HttpError(400, '保留天数需要在 1 到 3650 之间');
    merged[key] = value;
  }
  return merged;
}

async function count(db, predicate, ...args) {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM accounts WHERE ${predicate}`).bind(...args).first();
  return Number(row?.n || 0);
}

async function countProfiles(db, predicate, ...args) {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM profiles WHERE ${predicate}`).bind(...args).first();
  return Number(row?.n || 0);
}

// Counting and mutating must use the same predicate, so the cutoff timestamps
// are derived once per run and reused verbatim.
export async function countGhosts(db, { now = Date.now(), ...overrides } = {}) {
  const limits = policy(overrides);
  const orphanCutoff = now - limits.orphanDays * DAY_MS;
  const dormantCutoff = now - limits.dormantDays * DAY_MS;
  const tombstoneCutoff = now - limits.tombstoneDays * DAY_MS;
  const unownedCutoff = now - limits.unownedDays * DAY_MS;
  return {
    policy: limits,
    orphan: await count(db, ORPHAN, orphanCutoff, orphanCutoff),
    dormant: await count(db, DORMANT, dormantCutoff),
    expiredTombstones: await count(db, EXPIRED, tombstoneCutoff),
    unownedProfiles: await countProfiles(db, UNOWNED_PROFILE, unownedCutoff),
  };
}

export async function purgeGhosts(db, options = {}) {
  const { now = Date.now(), dryRun = true, ...overrides } = options;
  const limits = policy(overrides);
  const orphanCutoff = now - limits.orphanDays * DAY_MS;
  const dormantCutoff = now - limits.dormantDays * DAY_MS;
  const tombstoneCutoff = now - limits.tombstoneDays * DAY_MS;
  const unownedCutoff = now - limits.unownedDays * DAY_MS;
  const found = {
    orphan: await count(db, ORPHAN, orphanCutoff, orphanCutoff),
    dormant: await count(db, DORMANT, dormantCutoff),
    expiredTombstones: await count(db, EXPIRED, tombstoneCutoff),
    unownedProfiles: await countProfiles(db, UNOWNED_PROFILE, unownedCutoff),
  };
  const affected = { orphanDeleted: 0, dormantTombstoned: 0, tombstonePurged: 0, unownedPurged: 0 };
  if (dryRun) return { dryRun: true, policy: limits, found, affected };

  // Orphans first: they are pure noise, and removing them shrinks the set the
  // later statements have to look at.
  await db.prepare(`DELETE FROM accounts WHERE owner_hash IN (SELECT owner_hash FROM accounts WHERE ${ORPHAN})`)
    .bind(orphanCutoff, orphanCutoff).run();
  affected.orphanDeleted = found.orphan;

  await db.prepare(`UPDATE profiles SET deleted_at = ?, answers_json = '{}', result_json = '{}',
    nickname = '', share_id = NULL WHERE owner_hash IN (SELECT owner_hash FROM accounts WHERE ${DORMANT})`)
    .bind(now, dormantCutoff).run();
  await db.prepare(`UPDATE accounts SET deleted_at = ?, nickname = '', bio = '', portrait_id = NULL,
    friend_code = NULL, friends_visible = 0, require_friend_approval = 0, result_visibility = 'private',
    accent = NULL
    WHERE owner_hash IN (SELECT owner_hash FROM accounts WHERE ${DORMANT})`)
    .bind(now, dormantCutoff).run();
  affected.dormantTombstoned = found.dormant;

  // Relationships go first: they reference the account rows we are about to drop.
  await db.prepare(`DELETE FROM friendships WHERE
    owner_a IN (SELECT owner_hash FROM accounts WHERE ${EXPIRED})
    OR owner_b IN (SELECT owner_hash FROM accounts WHERE ${EXPIRED})`)
    .bind(tombstoneCutoff, tombstoneCutoff).run();
  await db.prepare(`DELETE FROM profiles WHERE owner_hash IN (SELECT owner_hash FROM accounts WHERE ${EXPIRED})`)
    .bind(tombstoneCutoff).run();
  await db.prepare(`DELETE FROM accounts WHERE owner_hash IN (SELECT owner_hash FROM accounts WHERE ${EXPIRED})`)
    .bind(tombstoneCutoff).run();
  affected.tombstonePurged = found.expiredTombstones;

  // Last: portraits that never belonged to an identity. Their account walk entry
  // does not exist, so nothing above could ever reach them.
  await db.prepare(`DELETE FROM profiles WHERE ${UNOWNED_PROFILE}`).bind(unownedCutoff).run();
  affected.unownedPurged = found.unownedProfiles;

  return { dryRun: false, policy: limits, found, affected };
}
