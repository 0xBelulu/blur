CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  owner_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  engine_version TEXT NOT NULL,
  question_version TEXT NOT NULL,
  answer_count INTEGER NOT NULL,
  answers_json TEXT NOT NULL,
  result_json TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '',
  share_id TEXT UNIQUE,
  deleted_at INTEGER
);
CREATE INDEX profiles_owner_created ON profiles(owner_hash, created_at DESC);
