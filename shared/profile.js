import { DIMENSION_KEYS } from './dimensions.js';

// Bump these when scoring or the question bank changes. Stored results stay snapshots.
export const ENGINE_VERSION = 'dimension-engine-v1';
export const QUESTION_VERSION = 'question-bank-v1';

const strings = (keys) => Object.fromEntries(keys.split(' ').map((key) => [key, 'string']));
const vector = Object.fromEntries(DIMENSION_KEYS.map((key) => [key, 'number']));
const companion = strings('key title symbol roleBadge relationType description');
const profile = {
  ...strings('title subtitle roleBadge roleSummary symbol description'),
  color: ['number'], vector, suppressedDimensions: ['string'],
  companion, complement: companion,
  narrative: strings('innerWorld inRelation hiddenSide'),
};
const trait = {
  ...strings('trait text detail longDesc direction triggerScene whyHidden latentPower'),
  score: 'number', raw: 'number',
};
const dimension = {
  ...strings('name direction negativeLabel positiveLabel negativeDesc positiveDesc'),
  score: 'number', raw: 'number',
};
const resultSchema = {
  archetype: profile, archetypeKey: 'string',
  secondaryArchetype: { ...strings('key title symbol roleBadge roleSummary'), prob: 'number', sim: 'number', profile },
  isDualResonance: 'boolean', dualSynergy: strings('title description coreTension'),
  tagDetails: [trait], scoredTraits: [trait], suppressedTraits: [trait],
  dimensionScores: Object.fromEntries(DIMENSION_KEYS.map((key) => [key, dimension])),
  userVector: vector,
  similarities: [{ key: 'string', sim: 'number', prob: 'number', profile }],
};

// An explicit nested allowlist: even extra fields inside a profile cannot leak answers.
function project(value, schema) {
  if (value == null) return value;
  if (typeof schema === 'string') {
    if (typeof value !== schema || (schema === 'number' && !Number.isFinite(value))) {
      throw new Error('画像字段格式不正确');
    }
    return value;
  }
  if (Array.isArray(schema)) {
    if (!Array.isArray(value)) throw new Error('画像列表格式不正确');
    return value.map((item) => project(item, schema[0]));
  }
  if (typeof value !== 'object' || Array.isArray(value)) throw new Error('画像对象格式不正确');
  return Object.fromEntries(Object.entries(schema)
    .filter(([key]) => value[key] !== undefined)
    .map(([key, shape]) => [key, project(value[key], shape)]));
}

export function publicResult(result) {
  const snapshot = project(result, resultSchema);
  const validProfile = (item) => item && typeof item.title === 'string' && item.narrative &&
    Array.isArray(item.color) && item.color.length === 3;
  if (!snapshot?.archetype?.narrative || !snapshot.tagDetails?.length ||
      !snapshot.scoredTraits?.length || !snapshot.similarities?.length ||
      !validProfile(snapshot.archetype) ||
      snapshot.similarities.some((item) => !validProfile(item.profile) || !Number.isFinite(item.prob)) ||
      [...snapshot.tagDetails, ...snapshot.scoredTraits].some((item) => !item || typeof item.text !== 'string' || !Number.isFinite(item.score)) ||
      !snapshot.dimensionScores || DIMENSION_KEYS.some((key) =>
        !Number.isFinite(snapshot.userVector?.[key]) || Math.abs(snapshot.userVector[key]) > 1 ||
        !snapshot.dimensionScores[key])) {
    throw new Error('画像数据不完整');
  }
  return snapshot;
}

export function publicRecord(record) {
  return {
    id: record.id, createdAt: record.createdAt,
    engineVersion: record.engineVersion, questionVersion: record.questionVersion,
    answerCount: record.answerCount, nickname: record.nickname || '',
    result: publicResult(record.result),
  };
}

export function canCompare(a, b) {
  return a.engineVersion === b.engineVersion && a.questionVersion === b.questionVersion;
}
