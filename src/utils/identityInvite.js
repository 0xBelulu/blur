// The post-result identity invite is a guest, not a gate.
// One chance per finished portrait, a short snooze after a quiet refusal, and
// no more automatic visits after two of them. Everything lives on this device.
const STORAGE_KEY = 'blur.identity-invite.v1';
export const INVITE_SNOOZE_MS = 3 * 86_400_000;
export const INVITE_MAX_DISMISSALS = 2;

function safeStorage() {
  try { return window.localStorage; } catch { return null; }
}

function read(storage) {
  try {
    const value = JSON.parse(storage?.getItem(STORAGE_KEY) || 'null');
    return value && typeof value === 'object' ? value : {};
  } catch { return {}; }
}

function write(storage, state) {
  try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Private mode keeps the invite working; it just won't remember. */ }
}

/**
 * Whether this finished result should open the invite on its own.
 * A registered identity is never asked; a portrait is only offered once.
 */
export function shouldInvite({ account, recordId, now = Date.now(), storage = safeStorage() } = {}) {
  if (account?.registered) return false;
  if (!recordId) return false;
  const state = read(storage);
  if (state.recordId === recordId) return false;
  if (Number(state.dismissals) >= INVITE_MAX_DISMISSALS) return false;
  if (Number(state.snoozedUntil) > now) return false;
  return true;
}

// Marks the portrait before the modal paints, so a re-render or a reload cannot
// open the same invitation twice.
export function noteInviteShown(recordId, storage = safeStorage()) {
  if (!recordId) return;
  write(storage, { ...read(storage), recordId, shownAt: Date.now() });
}

export function noteInviteDismissed(storage = safeStorage(), now = Date.now()) {
  const state = read(storage);
  write(storage, {
    ...state,
    dismissals: Number(state.dismissals || 0) + 1,
    snoozedUntil: now + INVITE_SNOOZE_MS,
  });
}

// Creating an identity clears the whole memory: if it is ever deleted, the next
// finished portrait may invite again from a clean slate.
export function noteInviteCreated(storage = safeStorage()) {
  try { storage?.removeItem(STORAGE_KEY); } catch { /* Nothing to clear. */ }
}
