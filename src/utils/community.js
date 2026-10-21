import { api } from './cloud.js';
import { getIdentityToken } from './identity.js';

/**
 * 读一次星图。
 *
 * 没有凭证时用 publicAccess：星图本来就允许匿名查看，而且读一页不该顺手
 * 给访客造一个本机身份（`api()` 默认会 getIdentityToken(true)）。
 * 带凭证时才可能拿回自己的那一个点。
 */
export function readCommunityField(signal) {
  const token = getIdentityToken();
  return api('/community/field', token ? { token, signal } : { publicAccess: true, signal });
}
