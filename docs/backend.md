# Blur 后端与部署

第一版支持匿名云端存档、可撤销的公开画像、双人对比。现有 React/Vite 前端继续静态托管；只有 `/api/*` 调用 Pages Functions，数据存入 D1。不需要单独租服务器。

## 本地完整运行

使用 Node.js 24（测试使用内置 SQLite）以及 `npm install` 安装的依赖。

```powershell
npm run build
npm run db:migrate:local
npm run dev:full
```

打开命令输出的本地地址（默认 `http://127.0.0.1:18788`）。本地 D1 数据在 `.wrangler/`，不会提交。修改前端后重新构建；也可以保留 `npm run dev` 做纯前端开发，Vite 会将 API 请求代理到本地 18788 端口。未启动后端时会正常降级到本机画像。

端口被占用时可用 `npm run dev:full -- --port 18788 --inspector-port 19333`。启动后可执行 `npm run test:runtime -- http://127.0.0.1:18788` 验证真实运行时的存档、权限、分享、撤销和组件渲染；测试只允许连接本地地址并使用临时测试画像。

## 接入现有 Cloudflare Pages 项目

1. 在项目目录执行 `npx wrangler login`，在浏览器完成自己的 Cloudflare 登录。
2. 执行 `npx wrangler d1 create blur`，将返回的真实 `database_id` 填入 `wrangler.jsonc`。`name` 改成现有 Pages 项目名称，数据库名称也可以自行调整。仓库中的全零 ID 只是占位符，不对应任何线上数据库。
3. 执行 `npm run db:migrate:remote`，建立线上数据表。
4. 保留 Pages 的构建命令 `npm run build`、输出目录 `dist`。Git 集成部署会同时编译仓库根目录的 `functions/`。也可手动执行 `npm run deploy`。预览环境如需写入数据，应单独配置测试 D1，避免连接生产数据。
5. 在 Cloudflare 项目 Settings → Bindings 检查 `DB` 指向正确的 D1，重新部署使配置生效。Wrangler 配置是绑定的来源，后续修改保持一致。

静态文件 `public/_routes.json` 会进入 `dist/`，明确只允许 `/api/*` 调用 Functions。分享 URL 使用 `#view/<随机标识>`，对比 URL 使用 `#compare/<随机标识>`；直接打开这些链接仍首先加载静态首页。不要增加覆盖所有路径的函数中间件，也不要将页面改为依赖 API 的服务端渲染。

上线前在一个预览部署完成：保存 → 分享 → 另一浏览器无登录打开 → 选历史／测试 → 对比 → 撤销 → 刷新旧链接。再用浏览器阻断 `/api/*` 验证本机测试、历史仍可用。

## 数据与权限

- 匿名管理凭证只存在当前浏览器 localStorage，请求时通过 Authorization 发送；数据库只存其 SHA-256 哈希。分享标识是另一个独立的随机值，没有管理权限。清除浏览器站点数据会失去私有存档的管理身份；第一版不提供账号恢复与跨设备历史同步。
- 每次测试生成独立、不可覆盖的结果快照；包含答案、结果、作答数量、时间、评分与题库版本。接口不会用新算法重算旧结果。发布分享不会影响其他记录。
- 原始答案只通过本人接口返回；公开接口用嵌套字段白名单输出画像，不包含答案、管理凭证或分享管理信息。完整公开画像包含叙事与隐藏潜能，按钮旁说明这一范围。
- 撤销后旧链接失效；再次开启分享生成新链接。所有 API 响应 `no-store`，不缓存公开画像。已经读到的内容无法从别人设备收回。
- 删除会清除答案、画像和分享标识，留下极小的记录 ID／所有者哈希墓碑，防止迟到的上传重试恢复已删除内容。
- 旧版本的本机历史首次分享时才上传；新测试先保存在本机，再自动同步。不自动公开、不自动上传全部旧历史。
- `shared/profile.js` 是快照的公开字段定义与版本入口。评分或题库发生不兼容变化时更新对应版本。双人对比要求评分、题库版本均相同；它表达相对倾向，不生成关系匹配百分比。

## 故障处理

保存失败保留本机记录并显示待同步；启动、恢复网络或手动重试时补传。相同记录的上传幂等。删除与撤销未获确认时保留待处理状态，界面不会宣称云端已经删除或链接已经失效。待处理删除在本机列表隐藏，但保留任务直至确认。

云端分享读取失败时，静态页面显示重试和返回测试入口。已经在当前会话加载的对方画像可以继续用于本地对比，不把画像持久缓存到浏览器。不会自动改成无法撤销的“把完整画像塞进 URL”；可以手动复制不包含链接的文字摘要。

## 控制台与排查

- Workers & Pages → 项目指标：请求量、错误、资源使用。
- 项目实时日志：按响应头 `X-Request-Id` 或错误响应的 `requestId` 关联请求。应用日志记录请求 ID、方法、状态、耗时，不记录凭证、分享标识和答案。Cloudflare 自身的访问日志设置另行管理。
- Storage & Databases → D1 → 数据库控制台：检查 `profiles`、时间与版本、是否存在 `share_id`。日常撤销和删除通过产品界面操作。
- 后端返回 503：先检查 DB 绑定、迁移是否完成，再查看 D1 日额度；前端不依赖 API 才能生成结果。

## 接口

私有接口均要求 `Authorization: Bearer <本机匿名凭证>`。

| 方法 | 路径 | 用途 |
| --- | --- | --- |
| GET | `/api/records` | 本人历史 |
| PUT | `/api/records/:id` | 幂等创建固定快照 |
| DELETE | `/api/records/:id` | 删除并撤销分享 |
| POST | `/api/records/:id/share` | 发布／复用分享，提交可选昵称 |
| DELETE | `/api/records/:id/share` | 撤销分享 |
| GET | `/api/shares/:shareId` | 无需身份的只读公开画像 |

集成测试执行实际 SQLite SQL，覆盖身份隔离、快照不变性、嵌套私密字段隔离、撤销后再发布、迟到上传、断网补传与待删除任务。`npm test` 包含这些测试；本地 Wrangler 联调另验证实际 Cloudflare 运行时。

参考：[Pages 路由](https://developers.cloudflare.com/pages/functions/routing/)、[D1 绑定](https://developers.cloudflare.com/pages/functions/bindings/)、[Wrangler 配置](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)。
