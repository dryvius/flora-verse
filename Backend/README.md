# FloraVerse Server

FloraVerse 微信小程序的 NestJS API。架构文档在 [`docs/`](docs/README.md)。

当前完成 Backend Bootstrap，以及核心领域表。Swagger 和健康检查可用。微信登录、业务 API 和 AI 能力尚未实现。

## 技术栈

- Node.js 22+
- pnpm 10
- NestJS 12（ESM）
- TypeScript 严格模式 + ESLint
- Prisma ORM 7 + MySQL 8
- Vitest

包名是 `floraverse-server`。应用根目录就是本 `Backend` 目录，和 `docs/` 放在一起。

## 本地启动

1. 安装 Node.js 22、pnpm 和 Docker Desktop。
2. 准备环境变量：

```powershell
cd Backend
Copy-Item .env.example .env
```

`.env` 已在 `.gitignore` 中。示例里的数据库账号和 JWT 占位值只用于本机。

3. 安装依赖并启动 MySQL：

```powershell
pnpm install
pnpm db:up
```

4. 执行迁移并启动 API：

```powershell
pnpm prisma:migrate
pnpm db:seed
pnpm start:dev
```

- 健康检查：`http://localhost:3000/api/v1/health`
- Swagger：`http://localhost:3000/api/docs`

成功时健康检查返回：

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "status": "ok",
    "checks": { "database": "up" },
    "timestamp": "2026-11-26T02:00:00.000Z"
  },
  "requestId": "req_..."
}
```

数据库不可用时返回 HTTP 503，`code` 为 `DATABASE_UNAVAILABLE`。响应不包含连接串、堆栈或驱动内部错误。

Worker 入口已接通同一个 Prisma Client，但本阶段不领取任务：

```powershell
pnpm start:worker
```

## 常用命令

| 命令 | 作用 |
|---|---|
| `pnpm lint` | ESLint |
| `pnpm test` | 单元测试，不连接数据库 |
| `pnpm test:e2e` | 端到端测试，需要本地 MySQL 已迁移 |
| `pnpm build` | 生成 Prisma Client 并编译 |
| `pnpm prisma:generate` | 只生成 Prisma Client |
| `pnpm prisma:deploy` | 部署已有迁移 |
| `pnpm db:seed` | 写入首发物种库、演示用户和示例个体 |
| `pnpm db:down` | 停止本地 MySQL，保留数据卷 |

## 目录

```text
src/
├── main.ts                 API 入口
├── worker.ts               Worker 入口
├── modules/health/         健康检查
├── infrastructure/database Prisma
└── common/                 配置、响应、异常、日志、requestId
prisma/schema.prisma        用户、分类、物种、资产、收录、个体
prisma/seed.ts              首发物种库与演示收藏
compose.yaml                本地 MySQL 8
```

`modules/` 里其余目录是后续业务模块的边界，本阶段没有接口实现。

## 约定

- HTTP 前缀是 `/api/v1`。成功和失败都使用文档中的统一响应，并带回 `requestId`。
- 生产环境默认关闭 Swagger。占位 JWT 不能用于 `NODE_ENV=production`。
- 修改 `prisma/schema.prisma` 后执行 `pnpm prisma:migrate`。
- 不要把 `.env`、AppSecret、AI Key 或 COS 密钥提交到 Git。
