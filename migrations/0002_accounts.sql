CREATE TABLE accounts (
  owner_hash TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);

ALTER TABLE profiles ADD COLUMN local_id TEXT;
UPDATE profiles SET local_id = id;
CREATE UNIQUE INDEX profiles_owner_local_active
  ON profiles(owner_hash, local_id) WHERE deleted_at IS NULL;
