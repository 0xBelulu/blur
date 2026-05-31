import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const files = [
  "src/data/questions-single.js",
  "src/data/questions-scale.js",
  "src/data/questions-rank.js",
];

/**
 * 缩放规则：
 * - changeAffinity > 1.0 的：乘以 0.55（1.9→1.0, 1.8→1.0, 1.7→0.9, 1.5→0.8）
 * - processingDepth > 1.0 的：乘以 0.55（1.9→1.0）
 * - expressivity < -1.0 的：乘以 0.55（-1.8→-1.0）
 * - energySource < -0.3 的：乘以 0.7（减弱独处倾向）
 */
const SCALE_RULES = {
  changeAffinity: { condition: (v) => v > 1.0, scale: 0.55 },
  processingDepth: { condition: (v) => v > 1.0, scale: 0.55 },
  expressivity: { condition: (v) => v < -1.0, scale: 0.55 },
  energySource: { condition: (v) => v < -0.3, scale: 0.7 },
};

function round1(v) {
  return Math.round(v * 10) / 10;
}

function processFile(filePath) {
  const absPath = path.join(root, filePath);
  let content = fs.readFileSync(absPath, "utf8");
  let modifiedBlocks = 0;

  // 匹配 dimensions: { ... } 块（单层对象，无嵌套）
  const dimRegex = /dimensions:\s*\{([^}]+)\}/g;
  let match;

  while ((match = dimRegex.exec(content)) !== null) {
    const fullBlock = match[0];
    const inner = match[1];
    let changed = false;

    const newInner = inner.replace(
      /(\w+):\s*(-?\d+\.\d+)/g,
      (m, key, valStr) => {
        const val = parseFloat(valStr);
        const rule = SCALE_RULES[key];
        if (rule && rule.condition(val)) {
          const newVal = round1(val * rule.scale);
          if (newVal !== val) {
            changed = true;
            return `${key}: ${newVal}`;
          }
        }
        return m;
      }
    );

    if (changed) {
      const newBlock = fullBlock.replace(inner, newInner);
      content = content.replace(fullBlock, newBlock);
      modifiedBlocks++;
    }
  }

  fs.writeFileSync(absPath, content);
  console.log(`${filePath}: 修改了 ${modifiedBlocks} 个 dimensions 块`);
}

console.log("=== 批量维度缩放 ===\n");
for (const f of files) {
  processFile(f);
}
console.log("\n完成。请运行 node scripts/balance-audit.js 验证。");
