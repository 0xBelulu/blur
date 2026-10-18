-- Public identifiers are independent of the secret credential and its hash.
ALTER TABLE accounts ADD COLUMN public_id TEXT;
ALTER TABLE accounts ADD COLUMN friend_code TEXT;
ALTER TABLE accounts ADD COLUMN bio TEXT NOT NULL DEFAULT '';
ALTER TABLE accounts ADD COLUMN portrait_id TEXT;
ALTER TABLE accounts ADD COLUMN friends_visible INTEGER NOT NULL DEFAULT 0 CHECK(friends_visible IN (0, 1));
UPDATE accounts SET public_id = lower(hex(randomblob(16))), friend_code = upper(hex(randomblob(6)));
CREATE UNIQUE INDEX accounts_public_id ON accounts(public_id);
CREATE UNIQUE INDEX accounts_friend_code ON accounts(friend_code);

CREATE TABLE friendships (
  id TEXT PRIMARY KEY,
  owner_a TEXT NOT NULL REFERENCES accounts(owner_hash),
  owner_b TEXT NOT NULL REFERENCES accounts(owner_hash),
  requester TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted')),
  created_at INTEGER NOT NULL,
  accepted_at INTEGER,
  CHECK(owner_a < owner_b),
  CHECK(requester = owner_a OR requester = owner_b),
  UNIQUE(owner_a, owner_b)
);
CREATE INDEX friendships_owner_b ON friendships(owner_b);
