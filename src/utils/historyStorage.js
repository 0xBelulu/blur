import { ENGINE_VERSION, QUESTION_VERSION } from "../../shared/profile.js";
const STORAGE_KEY = "blur.history.v1";

function canUseStorage() {
  try { return typeof window !== "undefined" && typeof window.localStorage !== "undefined"; }
  catch { return false; }
}

function readRecords() {
  if (!canUseStorage()) return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeClone(data) {
  try {
    if (typeof structuredClone === "function") {
      return structuredClone(data);
    }
  } catch {
    /* fallback to JSON serialization */
  }
  return JSON.parse(JSON.stringify(data));
}

function writeRecords(records) {
  if (!canUseStorage()) return false;

  if (records.length === 0) {
    try {
      window.localStorage.setItem(STORAGE_KEY, "[]");
      window.dispatchEvent?.(new Event("blur-history-change"));
      return true;
    } catch {
      return false;
    }
  }

  let current = records;
  while (current.length > 0) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent?.(new Event("blur-history-change"));
      return true;
    } catch {
      // Evict cached cloud records only, never pending uploads or deletions.
      const removable = current.findLastIndex((record, index) => index > 0 &&
        record.syncStatus === "synced" && !record.pendingAction && !record.deletedAt);
      if (removable < 0) return false;
      current = current.filter((_, index) => index !== removable);
    }
  }
  return false;
}

export function getHistoryRecords() {
  return readRecords().filter((record) => !record.deletedAt)
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function getAllHistoryRecords() { return readRecords(); }

export function updateHistoryRecord(id, changes) {
  const records = readRecords();
  const record = records.find((item) => item.id === id);
  if (!record) return null;
  Object.assign(record, changes);
  return writeRecords(records) ? record : null;
}

export function mergeCloudRecords(records) {
  const local = readRecords();
  const ids = new Set(local.map((record) => record.id));
  const remote = new Map(records.map((record) => [record.id, record]));
  const merged = local.map((record) => {
    if (record.deletedAt || record.pendingAction || record.syncStatus === "pending" || !remote.has(record.id)) return record;
    return { ...remote.get(record.id), syncStatus: "synced" };
  });
  return writeRecords([...merged, ...records.filter((record) => !ids.has(record.id))
    .map((record) => ({ ...record, syncStatus: "synced" }))]);
}

export function saveHistoryRecord(answers, result, syncStatus = "local") {
  const record = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    engineVersion: ENGINE_VERSION,
    questionVersion: QUESTION_VERSION,
    answers: safeClone(answers),
    result: safeClone(result),
    answerCount: Object.keys(answers).length,
    syncStatus,
  };

  const previous = readRecords();
  // Keep pending work even when the normal local archive reaches its limit.
  const mustKeep = (item) => item.syncStatus === "pending" || item.pendingAction || item.deletedAt;
  const records = [record, ...previous.filter(mustKeep), ...previous.filter((item) => !mustKeep(item)).slice(0, 29)];
  return writeRecords(records) ? record : null;
}

export function deleteHistoryRecord(id) {
  return writeRecords(readRecords().filter((record) => record.id !== id));
}

export function clearHistoryRecords() {
  return writeRecords([]);
}

