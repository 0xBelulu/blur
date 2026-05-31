import { singleQuestions } from "./questions-single.js";
import { scaleQuestions } from "./questions-scale.js";
import { rankQuestions } from "./questions-rank.js";

export const questions = [
  ...singleQuestions,
  ...scaleQuestions,
  ...rankQuestions,
];
