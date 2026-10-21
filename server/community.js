import { PROJECTION_VERSION, projectVector } from '../shared/projection.js';
import { sha256Hex } from '../shared/hex.js';
import { HttpError, json, readToken, body } from './http.js';

/**
 * 星图：只读、匿名、不可点开。
 *
 * 图上的人有两个来源，都不带身份：
 *
 * 1. **展示中的画像**——accounts.portrait_id + friends_visible。这是「我想被看见」的
 *    表态，可以随时收回（改「仅我可见」就没有点）。一个人在这里最多一个点。
 * 2. **一次测试完成**——field_points 里一行，没有 owner_hash、没有账号、没有答案。
 *    它回答的是另一个问题：「谁来过」。做完测试就留下，不需要注册。
 *
 * 为什么要有第二个来源：只有第一个时，星图的人数等于「愿意展示画像的人」，
 * 和「做完测试的人」差一个数量级（123 完成 / 19 云端画像 / 14 展示）。社区想让人
 * 看见自己在人群里的位置，参照系就该是后者。
 *
 * 代价写清楚：匿名点没有身份可查，所以只能靠本机保存的 id 撤下；换了浏览器或清了
 * 存储就再也找不到它。界面上必须这么讲，而不是假装它可撤销。
 *
 * 响应里只有坐标。没有 owner_hash、没有昵称、没有原型、没有时间、没有顺序——
 * 即使有人抓走整个响应，也还原不出「哪个点是谁」。这不是过滤，是不发。
 */
const FIELD_LIMIT = 5000;
const MAX_ANONYMOUS = 20000;
const POINT_ID = /^[a-f0-9]{32}$/;

const round = (value) => Math.round(value * 1000) / 1000;

async function fieldRows(db) {
  // 迁移与代码分开上线：表还没建的那段时间，星图仍然应该只显示展示画像，而不是 503。
  try {
    const { results } = await db.prepare('SELECT id, x, y FROM field_points LIMIT ?').bind(FIELD_LIMIT).all();
    return results;
  } catch { return []; }
}

async function completedCount(db) {
  try {
    const { results } = await db.prepare("SELECT count FROM metrics_daily WHERE metric = 'test_completed'").bind().all();
    return results.reduce((sum, row) => sum + Number(row.count || 0), 0);
  } catch { return 0; }
}

export async function communityRoute(request, env, path) {
  if (!path.startsWith('/api/community/')) return null;
  if (!env.DB) throw new HttpError(503, '星图暂不可用，请稍后再来');

  // 一次测试完成，留下一个匿名点。客户端送十维向量，坐标由服务端投影——
  // 前端不决定位置，否则改一行代码就能把所有人挪到同一个地方。
  if (path === '/api/community/point' && request.method === 'POST') {
    const input = await body(request);
    if (!POINT_ID.test(input.id || '')) throw new HttpError(400, '点标识不正确');
    const point = projectVector(input.vector);
    if (!point) throw new HttpError(400, '坐标数据不完整');
    try {
      const total = await env.DB.prepare('SELECT COUNT(*) AS n FROM field_points').bind().first();
      if (Number(total?.n || 0) >= MAX_ANONYMOUS) throw new HttpError(429, '星图暂时满了，请稍后再试');
      await env.DB.prepare('INSERT INTO field_points (id, x, y, created_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
        .bind(input.id, round(point.x), round(point.y), Date.now()).run();
    } catch (error) {
      if (error.status) throw error;
      throw new HttpError(503, '星图暂不可用，请稍后再来');
    }
    return json({ dropped: true });
  }

  // id 是本机保存的凭据，不在任何响应里出现过，所以能出示它的人就是创建它的人。
  const removal = path.match(/^\/api\/community\/point\/([a-f0-9]{32})$/);
  if (removal && request.method === 'DELETE') {
    try { await env.DB.prepare('DELETE FROM field_points WHERE id = ?').bind(removal[1]).run(); }
    catch { /* 表还没建：本来就没有点可撤。 */ }
    return json({ removed: true });
  }

  if (path !== '/api/community/field') throw new HttpError(404, '接口不存在');
  if (request.method !== 'GET') throw new HttpError(405, '不支持此操作');

  const token = readToken(request);
  const owner = token ? await sha256Hex(token) : null;
  // 本机保存的匿名点 id。出示它就能把自己的点从视野里摘出来，交给客户端单独标「你」。
  // 它从不出现在任何响应里，所以只有创建它的人知道。
  const asked = new URL(request.url).searchParams.get('point');
  const excludeId = POINT_ID.test(asked || '') ? asked : null;

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

  for (const row of await fieldRows(env.DB)) {
    if (!Number.isFinite(row.x) || !Number.isFinite(row.y)) continue;
    // 自己那个匿名点单独交还，不混在 points 里——否则客户端会画两个标记在同一点上。
    // 没有展示画像时，它就是「你」；有画像时以画像为准，这个点只是从自己的视野里去掉。
    if (excludeId && row.id === excludeId) {
      if (!you) you = { x: round(row.x), y: round(row.y), archetype: null };
      continue;
    }
    points.push([round(row.x), round(row.y)]);
  }

  return json({
    version: PROJECTION_VERSION,
    total: points.length + (you ? 1 : 0),
    // 聚合计数，和 admin 的「完成测试」同口径：解释「为什么图上是这个数」。
    completed: await completedCount(env.DB),
    points,
    you,
  });
}
