import { DIMENSIONS, DIMENSION_KEYS } from '../data/dimensions.js';

export function compareDimensions(a, b) {
  return DIMENSION_KEYS.map((key) => ({
    key, ...DIMENSIONS[key], a: a[key], b: b[key], gap: Math.abs(a[key] - b[key]),
  })).sort((a, b) => a.gap - b.gap);
}

export function tendency(value, dimension) {
  return Math.abs(value) < 0.1 ? '倾向居中' : value > 0 ? dimension.positive : dimension.negative;
}
