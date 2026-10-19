// Issues an admin token and prints the exact SQL that stores only its hash.
// The token itself is never written to disk, the database or the repository.
import { randomBytes, createHash } from 'node:crypto';
import { execSync } from 'node:child_process';

const target = process.argv.includes('--apply')
  ? process.argv[process.argv.indexOf('--apply') + 1] || 'local'
  : null;
const token = randomBytes(24).toString('hex');
const hash = createHash('sha256').update(token).digest('hex');
const sql = `INSERT OR REPLACE INTO admin_tokens (token_hash, label, created_at) VALUES ('${hash}', 'primary', ${Date.now()})`;

console.log('\n后台访问令牌（只显示这一次，请立即保存）：\n');
console.log(`  ${token}\n`);
console.log('写入本机数据库：');
console.log(`  npx wrangler d1 execute blur --local --command "${sql}"\n`);
console.log('写入线上数据库：');
console.log(`  npx wrangler d1 execute blur --remote --command "${sql}"\n`);
console.log('访问方式：打开 #admin，粘贴上面的令牌。数据库只保存它的 SHA-256，丢失后只能重新生成。\n');

if (target) {
  if (!['local', 'remote'].includes(target)) {
    console.error('用法：node scripts/admin-token.js [--apply local|remote]');
    process.exit(1);
  }
  console.log(`正在写入${target === 'local' ? '本机' : '线上'}数据库…`);
  execSync(`npx wrangler d1 execute blur --${target} --command "${sql}"`, { stdio: 'inherit', shell: true });
}
