-- Additive: old workers ignore this preference; existing relationships stay intact.
-- New clients present the current friend code as consent for direct connections.
ALTER TABLE accounts ADD COLUMN require_friend_approval INTEGER NOT NULL DEFAULT 0
  CHECK(require_friend_approval IN (0, 1));
