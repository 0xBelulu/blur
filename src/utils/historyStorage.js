const STORAGE_KEY = "blur.history.v1";
const ENGINE_VERSION = "dimension-engine-v1";
const QUESTION_VERSION = "question-bank-v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
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
      return true;
    } catch {
      return false;
    }
  }

  let current = records;
  while (current.length > 0) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      return true;
    } catch {
      // If quota exceeded, try dropping the oldest record and retry
      if (current.length > 1) {
        current = current.slice(0, -1);
      } else {
        return false;
      }
    }
  }
  return false;
}

export function getHistoryRecords() {
  return readRecords().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export function saveHistoryRecord(answers, result) {
  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    engineVersion: ENGINE_VERSION,
    questionVersion: QUESTION_VERSION,
    answers: safeClone(answers),
    result: safeClone(result),
  };

  const records = [record, ...readRecords()].slice(0, 30);
  return writeRecords(records) ? record : null;
}

export function deleteHistoryRecord(id) {
  return writeRecords(readRecords().filter((record) => record.id !== id));
}

export function clearHistoryRecords() {
  return writeRecords([]);
}

