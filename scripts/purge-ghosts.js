#!/usr/bin/env node
// Ghost account cleanup. Dry-run by default: only --apply writes anything.
// Uses the same admin token as the dashboard; the token is never printed.
const args = process.argv.slice(2);
const flag = (name) => { const index = args.indexOf(name); return index >= 0 ? args[index + 1] : undefined; };
const apply = args.includes('--apply');

const base = (flag('--base') || process.env.BLUR_BASE || 'http://127.0.0.1:18788').replace(/\/+$/, '');
const token = flag('--token') || process.env.BLUR_ADMIN_TOKEN || '';

if (!token) {
  console.error('缺少后台令牌：设置 BLUR_ADMIN_TOKEN 环境变量，或传 --token <令牌>。');
  process.exit(1);
}
if (!/^https?:\/\//.test(base) || (base.startsWith('http://') && !/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(base))) {
  console.error('只接受 https 地址或本机 http 地址，避免把后台令牌发到明文网络上。');
  process.exit(1);
}

const payload = { dryRun: !apply };
for (const [name, key] of [['--orphan-days', 'orphanDays'], ['--dormant-days', 'dormantDays'], ['--tombstone-days', 'tombstoneDays']]) {
  const raw = flag(name);
  if (raw === undefined) continue;
  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value) || value < 1) {
    console.error(`${name} 需要一个正整数。`);
    process.exit(1);
  }
  payload[key] = value;
}

let response;
try {
  response = await fetch(`${base}/api/admin/ghosts/purge`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
} catch {
  console.error(`无法连接 ${base}，请确认本地服务或线上地址可用。`);
  process.exit(1);
}

const data = await response.json().catch(() => null);
if (!response.ok || !data) {
  console.error(`请求失败（${response.status}）：${data?.message || '没有返回内容'}`);
  process.exit(1);
}

const { policy, found, affected } = data;
console.log(`\n模式：${data.dryRun ? '只读检查（未写入）' : '实际执行'}`);
console.log(`策略：孤儿 ${policy.orphanDays} 天 · 休眠 ${policy.dormantDays} 天 · 墓碑保留 ${policy.tombstoneDays} 天`);
console.log(`命中：孤儿 ${found.orphan} · 休眠 ${found.dormant} · 过期墓碑 ${found.expiredTombstones}`);
if (data.dryRun) {
  console.log('\n确认无误后加 --apply 再运行一次。孤儿会被删除，休眠身份会清空内容并留下墓碑。\n');
} else {
  console.log(`已处理：删除孤儿 ${affected.orphanDeleted} · 墓碑化 ${affected.dormantTombstoned} · 清除过期墓碑 ${affected.tombstonePurged}\n`);
}
