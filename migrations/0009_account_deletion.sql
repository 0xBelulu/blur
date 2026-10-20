-- 注销：账号行保留为墓碑，内容和标识清空，旧设备无法用同一凭证复活它。
-- Additive and nullable: the previous worker ignores the column and keeps working.
ALTER TABLE accounts ADD COLUMN deleted_at INTEGER;

-- Existing rows stay active; the cleanup pass reads tombstones and inactivity together.
CREATE INDEX accounts_deleted ON accounts(deleted_at);
CREATE INDEX accounts_purge ON accounts(deleted_at, last_seen_at, created_at);
