import { singleQuestions } from "./questions-single.js";
import { scaleQuestions } from "./questions-scale.js";
import { rankQuestions } from "./questions-rank.js";

export { singleQuestions, scaleQuestions, rankQuestions };

export const questions = [
  ...singleQuestions,
  ...scaleQuestions,
  ...rankQuestions,
];
