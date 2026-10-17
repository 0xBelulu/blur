import { questions } from '../src/data/questions.js';
import fs from 'fs';

const single = questions.filter(q => q.type === 'single');
let out = '';
for (const q of single) {
  out += `Q${q.id} (${q.text.length}字: ${q.text})\n`;
  for (const opt of q.options) {
    out += `  [${opt.id}] (${opt.text.length}字): ${opt.text}\n`;
  }
}
fs.writeFileSync('scripts/single-audit.txt', out, 'utf8');
console.log('Written utf8');
