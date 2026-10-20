/**
 * 字节 → 十六进制的唯一实现。
 *
 * 这段逻辑以前有三份：src/utils/identity.js（算本机身份 id）、
 * server/api.js（算 owner_hash）、server/metrics.js（算后台令牌 hash）。
 * 三处都是「SHA-256 → hex」，任何一处写错都会让身份对不上而没有任何报错。
 *
 * 依赖 Web Crypto，浏览器与 Workers 都原生支持。
 */

export function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** 32 字节随机数的 hex 形式，用作本机凭证。 */
export function randomHex(byteLength = 32) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function sha256Hex(value) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(digest);
}
