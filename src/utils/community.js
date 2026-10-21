import { randomHex } from '../../shared/hex.js';
import { api } from './cloud.js';
import { getIdentityToken } from './identity.js';

/**
 * 星图上的两种点，客户端这一半只管「匿名点」：
 * 展示画像那条由服务端按 portrait_id 决定，这里不参与。
 *
 * 一台设备一个点：完成第二次测试不会再多出一个点。设备之间无法去重——
 * 没有身份就没有办法知道「这两个点是同一个人」，这是匿名的代价，不是 bug。
 */
const POINT_KEY = 'blur.field-point.v1';

export function localFieldPoint() {
  try { return localStorage.getItem(POINT_KEY); } catch { return null; }
}

/**
 * 读一次星图。没有凭证时用 publicAccess：星图本来就允许匿名查看，而且读一页
 * 不该顺手给访客造一个本机身份（`api()` 默认会 getIdentityToken(true)）。
 */
export function readCommunityField(signal) {
  const token = getIdentityToken();
  const point = localFieldPoint();
  // 带上自己的匿名点 id：服务端把它从 points 里摘出来单独返回，客户端才知道该在哪画「你」。
  const path = `/community/field${point ? `?point=${point}` : ''}`;
  return api(path, token ? { token, signal } : { publicAccess: true, signal });
}

/**
 * 完成一次测试后调用。已经有展示画像的人不用留匿名点——展示画像本身就是他的位置，
 * 两个都留会让一个人变成两个点。
 */
export async function dropFieldPoint(vector) {
  if (localFieldPoint()) return null;
  const id = randomHex(16);
  await api('/community/point', { method: 'POST', publicAccess: true, body: { id, vector } });
  try { localStorage.setItem(POINT_KEY, id); } catch { /* 存不下就撤不回，但点已经在了。 */ }
  return id;
}

/** 撤下这台设备留下的那个点。id 是唯一凭据，没有它就没有别的办法找到这个点。 */
export async function withdrawFieldPoint() {
  const id = localFieldPoint();
  if (!id) return false;
  await api(`/community/point/${id}`, { method: 'DELETE', publicAccess: true });
  try { localStorage.removeItem(POINT_KEY); } catch { /* 本地清不掉时服务端已经删了。 */ }
  return true;
}
