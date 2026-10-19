-- Aggregate-only counters. No identity, address, device or answer data is stored.
-- One row per (UTC day, metric); the client only ever increments a named counter.
CREATE TABLE metrics_daily (
  day TEXT NOT NULL,
  metric TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0 CHECK(count >= 0),
  PRIMARY KEY (day, metric)
);
CREATE INDEX metrics_daily_day ON metrics_daily(day);

-- Coarse activity signal for retention. Written at most once per account per day.
ALTER TABLE accounts ADD COLUMN last_seen_at INTEGER;
