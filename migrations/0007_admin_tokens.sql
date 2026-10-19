-- Admin access is a separate secret, not a flag on a user account.
-- Only the SHA-256 of the token is stored, so the database never holds a usable key.
CREATE TABLE admin_tokens (
  token_hash TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL
);
