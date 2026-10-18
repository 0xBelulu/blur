import { questions } from '../data/questions.js';

const QUESTION_MAP = new Map(questions.map((question) => [question.id, question]));

const SCALE_LABELS = ['完全不同意', '不太同意', '说不清', '有点同意', '完全同意'];

export function scaleLabel(value) {
  return SCALE_LABELS[Math.round(value) - 1] || '说不清';
}

/**
 * 答案可能有两种形态：
 * - 数组：[{ questionId, type, optionId | value | rankOrder }]
 * - 以题目 id 为键的对象：{ "12": "a", "30": 5, "18": ["c","a","b","d"] }
 */
function toAnswerMap(answers) {
  const map = new Map();
  if (!answers) return map;

  if (Array.isArray(answers)) {
    for (const answer of answers) {
      if (!answer || answer.questionId === undefined) continue;
      map.set(Number(answer.questionId), answer);
    }
    return map;
  }

  for (const [key, value] of Object.entries(answers)) {
    const questionId = Number(key);
    if (!Number.isFinite(questionId) || value === null || value === undefined) continue;
    if (typeof value === 'object' && !Array.isArray(value)) {
      map.set(Number(value.questionId ?? questionId), { questionId, ...value });
    } else if (typeof value === 'string') {
      map.set(questionId, { questionId, type: 'single', optionId: value });
    } else if (typeof value === 'number') {
      map.set(questionId, { questionId, type: 'scale', value });
    } else if (Array.isArray(value)) {
      map.set(questionId, { questionId, type: 'rank', rankOrder: value });
    }
  }
  return map;
}

function optionOf(question, optionId) {
  if (!question?.options) return null;
  return question.options.find((option) => option.id === optionId) || null;
}

/** 一个选项在十个维度上有多"重" —— 越重，越能代表这个人 */
function optionStrength(option) {
  if (!option?.dimensions) return 0;
  return Object.values(option.dimensions).reduce((sum, value) => sum + Math.abs(value), 0);
}

/** 两个选项在维度空间里的距离，用来判断"分岔得有多远" */
function optionDistance(a, b) {
  const da = a?.dimensions || {};
  const db = b?.dimensions || {};
  const keys = new Set([...Object.keys(da), ...Object.keys(db)]);
  let sum = 0;
  for (const key of keys) {
    const delta = (da[key] || 0) - (db[key] || 0);
    sum += delta * delta;
  }
  return Math.sqrt(sum);
}

/**
 * 把两份作答翻成"故事素材"：
 * 同一道题上两个人怎么选的、哪一题最像、哪一题最远。
 */
export function buildComparisonStory(mine, theirs) {
  const mineMap = toAnswerMap(mine?.answers);
  const theirsMap = toAnswerMap(theirs?.answers);
  const sharedIds = [...mineMap.keys()].filter((id) => theirsMap.has(id));

  const same = [];
  const split = [];

  for (const id of sharedIds) {
    const question = QUESTION_MAP.get(id);
    if (!question) continue;
    const a = mineMap.get(id);
    const b = theirsMap.get(id);

    if (question.type === 'single' || question.type === 'rank') {
      const mineOptionId = question.type === 'rank' ? a.rankOrder?.[0] : a.optionId;
      const theirsOptionId = question.type === 'rank' ? b.rankOrder?.[0] : b.optionId;
      const mineOption = optionOf(question, mineOptionId);
      const theirsOption = optionOf(question, theirsOptionId);
      if (!mineOption || !theirsOption) continue;

      const item = {
        id,
        kind: question.type,
        text: question.text,
        mine: mineOption.text,
        theirs: theirsOption.text,
      };

      if (mineOption.id === theirsOption.id) {
        same.push({ ...item, weight: optionStrength(mineOption) });
      } else {
        split.push({ ...item, weight: optionDistance(mineOption, theirsOption) });
      }
      continue;
    }

    if (question.type === 'scale') {
      const mineValue = Number(a.value);
      const theirsValue = Number(b.value);
      if (!Number.isFinite(mineValue) || !Number.isFinite(theirsValue)) continue;

      const item = {
        id,
        kind: 'scale',
        text: question.text,
        mine: scaleLabel(mineValue),
        theirs: scaleLabel(theirsValue),
        mineValue,
        theirsValue,
      };

      const gap = Math.abs(mineValue - theirsValue);
      if (gap <= 1) {
        same.push({ ...item, weight: (5 - gap) * 0.5 });
      } else {
        split.push({ ...item, weight: gap / 4 });
      }
    }
  }

  same.sort((x, y) => y.weight - x.weight);
  split.sort((x, y) => y.weight - x.weight);

  return {
    sharedCount: sharedIds.length,
    sameCount: same.length,
    splitCount: split.length,
    bestSame: same[0] || null,
    bestSplit: split[0] || null,
  };
}
