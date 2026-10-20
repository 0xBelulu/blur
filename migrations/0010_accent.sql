-- 主色（accent）是账号级的外观偏好，与画像权限无关。
-- 纯增量、可空：老 worker 既不读也不写这一列，可以先于代码上线。
-- 不加 CHECK：色板会演进，把枚举写进 DDL 意味着每加一色都要一次迁移；
-- 白名单在服务端校验（ACCENT_KEYS），非法值不落库。
-- NULL 与 'follow' 都表示「跟随当前展示画像」。
ALTER TABLE accounts ADD COLUMN accent TEXT;
