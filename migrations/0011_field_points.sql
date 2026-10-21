-- 匿名星图点：一次测试完成 = 一行，没有 owner_hash、没有账号、没有答案。
-- 与 accounts.portrait_id 那条来源并存：展示中的画像仍然各自是一个点。
-- id 由客户端生成并只保存在本机，是撤下这个点的唯一凭据；服务端不存它的散列。
CREATE TABLE field_points (
  id TEXT PRIMARY KEY,
  x REAL NOT NULL,
  y REAL NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX field_points_created ON field_points(created_at);
