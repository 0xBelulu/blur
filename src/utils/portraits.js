import { ARCHETYPE_PROFILES } from '../data/archetypeProfiles.js';

export function recordArchetype(record) {
  if (!record) return null;
  return record.result?.archetype || Object.values(ARCHETYPE_PROFILES).find((p) => p.title === record.preview?.title) || null;
}

export function displayRecord(records, account) {
  if (account.portraitId) return records.find((r) => r.cloudId === account.portraitId) || null;
  if (account.displayRecordId !== undefined) return records.find((r) => r.id === account.displayRecordId) || null;
  return records[0] || null;
}
