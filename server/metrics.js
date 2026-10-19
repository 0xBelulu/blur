import { HttpError, json, body } from './http.js';

// Public counters are deliberately a closed set. An unknown name is rejected so
// the table cannot grow arbitrary keys from the browser.
const PUBLIC_EVENTS = new Set(['test_started', 'test_completed']);
const DAY_MS = 86_400_000;

export async function recordMetric(db, metric, amount = 1) {
  await db.prepare(`INSERT INTO metrics_daily (day, metric, count)
    VALUES (strftime('%Y-%m-%d', 'now'), ?, ?)
    ON CONFLICT(day, metric) DO UPDATE SET count = count + excluded.count`)
    .bind(metric, amount).run();
}

// Best-effort telemetry: a missing column or a transient write error must never
// break identity reads, including on a deployment that is ahead of its migration.
export async function touchAccount(db, owner) {
  const now = Date.now();
  try {
    await db.prepare(`UPDATE accounts SET last_seen_at = ?
      WHERE owner_hash = ? AND (last_seen_at IS NULL OR last_seen_at < ?)`)
      .bind(now, owner, now - DAY_MS).run();
  } catch { /* Retention is optional; the account read still succeeds. */ }
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// Admin access is deliberately outside the user identity system: a leaked user
// token can never reach this route, and there is no is_admin flag to escalate.
async function requireAdmin(request, db) {
  const provided = request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{24,200})$/)?.[1];
  if (!provided) throw new HttpError(401, '需要后台访问令牌');
  const row = await db.prepare('SELECT token_hash FROM admin_tokens WHERE token_hash = ?')
    .bind(await sha256(provided)).first();
  if (row) return;
  const configured = await db.prepare('SELECT 1 AS ok FROM admin_tokens LIMIT 1').bind().first();
  throw new HttpError(configured ? 401 : 503,
    configured ? '后台访问令牌不正确' : '后台尚未初始化访问令牌，请先运行 npm run admin:token');
}

function dayKey(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function count(row) {
  return Number(row?.n || 0);
}

async function adminStats(db, rawDays) {
  const parsed = Number.parseInt(rawDays ?? '30', 10);
  const days = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 90) : 30;
  const now = Date.now();
  const series = Array.from({ length: days }, (_, index) => dayKey(now - (days - 1 - index) * DAY_MS));
  const since = Date.parse(`${series[0]}T00:00:00Z`);

  const totals = await db.prepare(`SELECT
    (SELECT COUNT(*) FROM accounts) AS accounts,
    (SELECT COUNT(*) FROM accounts WHERE created_at >= ?) AS newAccounts,
    (SELECT COUNT(*) FROM accounts WHERE portrait_id IS NOT NULL) AS accountsWithPortrait,
    (SELECT COUNT(*) FROM accounts WHERE last_seen_at >= ?) AS accountsSeen7d,
    (SELECT COUNT(*) FROM accounts WHERE last_seen_at >= ?) AS accountsSeen30d,
    (SELECT COUNT(*) FROM profiles WHERE deleted_at IS NULL) AS profiles,
    (SELECT COUNT(*) FROM profiles WHERE deleted_at IS NULL AND share_id IS NOT NULL) AS liveShares,
    (SELECT COUNT(*) FROM friendships) AS friendships,
    (SELECT COUNT(*) FROM friendships WHERE status = 'accepted') AS acceptedFriendships,
    (SELECT MIN(last_seen_at) FROM accounts) AS lastSeenSince`)
    .bind(since, now - 7 * DAY_MS, now - 30 * DAY_MS).first();

  const { results: accountRows } = await db.prepare(`SELECT
    strftime('%Y-%m-%d', created_at / 1000, 'unixepoch') AS day, COUNT(*) AS n
    FROM accounts WHERE created_at >= ? GROUP BY day`).bind(since).all();

  const { results: eventRows } = await db.prepare(
    'SELECT day, metric, count FROM metrics_daily WHERE day >= ?').bind(series[0]).all();

  const { results: versions } = await db.prepare(`SELECT question_version AS questionVersion,
    engine_version AS engineVersion, COUNT(*) AS n FROM profiles WHERE deleted_at IS NULL
    GROUP BY question_version, engine_version ORDER BY n DESC LIMIT 8`).bind().all();

  const byDay = new Map(series.map((day) => [day, { day, accounts: 0, test_started: 0, test_completed: 0 }]));
  for (const row of accountRows) {
    const entry = byDay.get(row.day);
    if (entry) entry.accounts = count(row);
  }
  const events = { test_started: 0, test_completed: 0 };
  for (const row of eventRows) {
    const entry = byDay.get(row.day);
    if (entry && row.metric in events) entry[row.metric] = Number(row.count);
    if (row.metric in events) events[row.metric] += Number(row.count);
  }

  return {
    generatedAt: now,
    rangeDays: days,
    cloud: {
      accounts: Number(totals?.accounts || 0),
      newAccounts: Number(totals?.newAccounts || 0),
      accountsWithPortrait: Number(totals?.accountsWithPortrait || 0),
      accountsSeen7d: Number(totals?.accountsSeen7d || 0),
      accountsSeen30d: Number(totals?.accountsSeen30d || 0),
      profiles: Number(totals?.profiles || 0),
      liveShares: Number(totals?.liveShares || 0),
      friendships: Number(totals?.friendships || 0),
      acceptedFriendships: Number(totals?.acceptedFriendships || 0),
      lastSeenSince: Number(totals?.lastSeenSince || 0),
    },
    events,
    daily: series.map((day) => byDay.get(day)),
    versions: versions.map((row) => ({ ...row, n: Number(row.n) })),
  };
}

export async function metricsRoute(request, env, path) {
  if (path === '/api/metrics/event') {
    if (request.method !== 'POST') throw new HttpError(405, '不支持此操作');
    const input = await body(request);
    if (!PUBLIC_EVENTS.has(input.event)) throw new HttpError(400, '未知的统计事件');
    await recordMetric(env.DB, input.event);
    return json({ recorded: true });
  }
  if (path === '/api/admin/stats') {
    if (request.method !== 'GET') throw new HttpError(405, '不支持此操作');
    await requireAdmin(request, env.DB);
    return json(await adminStats(env.DB, new URL(request.url).searchParams.get('days')));
  }
  return null;
}
