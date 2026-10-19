-- Dashboard totals are materialized once per TTL instead of scanning on every read.
-- The payload holds counts only: no identity, answer or portrait content.
CREATE TABLE stats_snapshots (
  day TEXT PRIMARY KEY,
  computed_at INTEGER NOT NULL,
  payload TEXT NOT NULL
);

-- Range scans for the daily series and the activity counts.
CREATE INDEX accounts_created ON accounts(created_at);
CREATE INDEX accounts_last_seen ON accounts(last_seen_at);
