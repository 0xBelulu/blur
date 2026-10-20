import { questions } from '../src/data/questions.js';

// 题库审阅辅助：把单选题目与选项连同字数打到 stdout，方便检查文案长度。
// 不落盘——需要留档就自己重定向：
//   node scripts/audit-review.mjs > /tmp/single-audit.txt
const lines = [];
for (const question of questions.filter((q) => q.type === 'single')) {
  lines.push(`Q${question.id} (${question.text.length}字: ${question.text})`);
  for (const option of question.options) {
    lines.push(`  [${option.id}] (${option.text.length}字): ${option.text}`);
  }
}
console.log(lines.join('\n'));
