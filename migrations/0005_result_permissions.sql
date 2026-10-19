-- Account-wide permission for the displayed test result, independent of whether
-- a portrait already exists. Keep explicitly private selected portraits private.
ALTER TABLE accounts ADD COLUMN result_visibility TEXT NOT NULL DEFAULT 'friends'
  CHECK(result_visibility IN ('private', 'friends'));
UPDATE accounts SET result_visibility = 'private'
  WHERE portrait_id IS NOT NULL AND friends_visible = 0;

-- During migration-first rollout, old workers still write the legacy boolean.
CREATE TRIGGER accounts_legacy_result_visibility
AFTER UPDATE OF friends_visible ON accounts WHEN NEW.portrait_id IS NOT NULL
BEGIN
  UPDATE accounts SET result_visibility = CASE WHEN NEW.friends_visible = 1 THEN 'friends' ELSE 'private' END
    WHERE owner_hash = NEW.owner_hash;
END;
