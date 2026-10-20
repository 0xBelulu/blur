const TOKEN_KEY = 'blur.identity.v1';
const ACCOUNT_KEY = 'blur.account.v1';

export function getIdentityToken(create = false) {
  let token = localStorage.getItem(TOKEN_KEY);
  if (!token && create) {
    token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(TOKEN_KEY, token);
  }
  return token;
}

export async function identityId(token) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 12);
}

export function getAccountInfo() {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}'); }
  catch { return {}; }
}

export function updateAccountInfo(changes) {
  const account = { ...getAccountInfo(), ...changes };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  window.dispatchEvent?.(new Event('blur-account-change'));
  return account;
}

export async function ensureLocalIdentity() {
  const token = getIdentityToken(true);
  const id = await identityId(token);
  if (getIdentityToken() !== token) throw new Error('身份已切换，请重新操作');
  if (getAccountInfo().id !== id) {
    if (getAccountInfo().id) localStorage.removeItem(ACCOUNT_KEY);
    return updateAccountInfo({ id, registered: false, lastVerifiedAt: null });
  }
  return getAccountInfo();
}

export function formatRecoveryKey(token) {
  return `BLUR-${token.match(/.{8}/g).join('-').toUpperCase()}`;
}

export function parseRecoveryKey(key) {
  const token = key.trim().replace(/^BLUR-/i, '').replaceAll('-', '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(token)) throw new Error('恢复密钥格式不正确，请完整复制 BLUR 开头的密钥');
  return token;
}

export function adoptIdentity(token, account) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify({ ...account, registered: true, lastVerifiedAt: Date.now() }));
  window.dispatchEvent?.(new Event('blur-account-change'));
}

// Leaving a device only drops the credential and its cached identity. Device
// portraits are the user's own copies and stay until they clear them.
export function forgetDeviceIdentity() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ACCOUNT_KEY);
  window.dispatchEvent?.(new Event('blur-account-change'));
}
