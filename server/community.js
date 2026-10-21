import { PROJECTION_VERSION, projectVector } from '../shared/projection.js';
import { sha256Hex } from '../shared/hex.js';
import { HttpError, json, readToken } from './http.js';

/**
 * 星图：只读、匿名、不可点开。
 *
 * 谁在图上一个点？——**展示中的那份画像**。不是另开一个「加入社区」的开关：
 * 一个人在权限里选择把哪份画像展示出来，那个选择本身就是他的表态。
 * 「仅我可见」没有点，「好友可见」有一个没有名字的点。
 *
 * 所以这里没有新表，也没有迁移：accounts.portrait_id + friends_visible 已经
 * 完整表达了这件事，profiles.result_json 里有算好的十维向量。
 *
 * 响应里只有坐标。没有 owner_hash、没有昵称、没有原型、没有时间、没有顺序——
 * 即使有人抓走整个响应，也还原不出「哪个点是谁」。这不是过滤，是不发。
 */
const FIELD_LIMIT = 5000;

const round = (value) => Math.round(value * 1000) / 1000;

export async function communityRoute(request, env, path) {
  if (path !== '/api/community/field') return null;
  if (request.method !== 'GET') throw new HttpError(405, '不支持此操作');
  if (!env.DB) throw new HttpError(503, '星图暂不可用，请稍后再来');

  const token = readToken(request);
  const owner = token ? await sha256Hex(token) : null;

  // 没有 ORDER BY：顺序本身也是信息，不提供。
  // 自己的那一行多取一个原型名：这是本人的数据，省掉一次「本机记录还没同步」的空窗。
  const { results } = await env.DB.prepare(`SELECT a.owner_hash, json_extract(p.result_json, '$.userVector') AS vector,
      json_extract(p.result_json, '$.archetype.title') AS title
    FROM accounts a
    JOIN profiles p ON p.id = a.portrait_id AND p.owner_hash = a.owner_hash AND p.deleted_at IS NULL
    WHERE a.deleted_at IS NULL AND a.friends_visible = 1
    LIMIT ?`).bind(FIELD_LIMIT).all();

  const points = [];
  let you = null;
  for (const row of results) {
    let vector;
    try { vector = JSON.parse(row.vector); } catch { continue; }
    const point = projectVector(vector);
    // 向量不完整就跳过：画到原点会让「居中」这个位置说谎。
    if (!point) continue;
    if (owner && row.owner_hash === owner) {
      you = { x: round(point.x), y: round(point.y), archetype: typeof row.title === 'string' ? row.title : null };
      continue;
    }
    points.push([round(point.x), round(point.y)]);
  }

  return json({ version: PROJECTION_VERSION, total: points.length + (you ? 1 : 0), points, you });
}
