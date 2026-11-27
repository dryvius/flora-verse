# FloraVerse

现实植物探索与数字收藏。用户拍摄身边的植物，确认识别结果后，把它收成自己植物谱里的一株数字个体。

首发载体是微信小程序。当前仓库同时包含可运行的小程序前端，以及正在按模块落地的 NestJS API。

**核心循环：** 发现植物 → 拍摄或选图 → 识别 → 用户确认 → 生成植物个体 → 收入植物谱 → 继续发现。

## 仓库结构

```text
FloraVerse/
├── Backend/          NestJS API、Prisma、本地 MySQL
│   └── docs/         后端架构、数据、接口与部署文档
├── Frentend/         uni-app 微信小程序（目录名即此）
│   └── docs/         产品、玩法、数据模型与前端说明
└── README.md         本文件
```

| 目录 | 包名 | 职责 |
|---|---|---|
| `Backend/` | `floraverse-server` | 身份、物种、收录与后续 AI 任务的服务端 |
| `Frentend/` | `floraverse` | 营地、收录、图鉴、排行与个人页 |

更细的设计不写在这里。后端从 [Backend/docs/README.md](Backend/docs/README.md) 进入，产品与前端从 [Frentend/README.md](Frentend/README.md) 进入。

## 现在做到哪一步

小程序的拍摄、识别、收录、图鉴、排行和营地页面可以在本地 Mock 数据上完整走通。账号注册、登录和当前用户资料已经接到真实 API；图鉴、收录、排行等业务数据仍读本地 Mock。

| 部分 | 状态 |
|---|---|
| 小程序页面与 Mock 闭环 | 可运行。默认数据源是 `mock` |
| 注册 / 登录 | 已接通。`POST /api/v1/auth/register`、`POST /api/v1/auth/login` |
| 当前用户 | 已接通。持有 access token 时，`GET /api/v1/users/me` 覆盖本地用户资料 |
| 核心领域表 | 已迁移。用户、分类、物种、资产、收录、个体 |
| 健康检查与 Swagger | 可用 |
| 微信登录、识别、收录、图鉴、排行、对象存储、图像生成 | 模块边界已留出，HTTP 接口尚未实现 |

登录签发 15 分钟 access token，不签发 refresh token。生产环境不要使用 `.env.example` 里的占位密钥。

## 技术栈

| 层 | 选型 |
|---|---|
| 小程序 | uni-app、Vue 3、TypeScript、Pinia、Vite |
| API | NestJS 12（ESM）、REST `/api/v1`、Swagger |
| 数据 | MySQL 8、Prisma 7 |
| 异步任务 | 同仓库 Worker 进程；V1 用 MySQL 任务表，不引入 Redis / BullMQ |
| 测试 | Vitest |
| 包管理 | pnpm 10，Node.js 22+ |

架构是模块化单体：一个 API 进程负责请求，一个 Worker 进程负责后续的识别与生成任务。物种是公共主数据，个体是用户的私人收藏；识别只给建议，用户确认后才创建收藏。

## 本地开发

需要 Node.js 22、pnpm 10。后端还需要 Docker Desktop。

### 后端

```powershell
cd Backend
Copy-Item .env.example .env
pnpm install
pnpm db:up
pnpm prisma:migrate
pnpm db:seed
pnpm start:dev
```

- 健康检查：`http://localhost:3000/api/v1/health`
- Swagger：`http://localhost:3000/api/docs`
- 停止 MySQL 并保留数据：`pnpm db:down`

`pnpm db:seed` 写入首发物种、演示用户和示例个体。Worker 入口是 `pnpm start:worker`，当前不领取任务。

换电脑后的空库重建、以及是否导出本机联调数据，见 [Backend/docs/11-local-machine-migration.md](Backend/docs/11-local-machine-migration.md)。

### 小程序

```powershell
cd Frentend
pnpm install
pnpm generate:tab-icons
pnpm dev:mp-weixin
```

用微信开发者工具导入 `Frentend/dist/dev/mp-weixin`。`src/manifest.json` 里的微信 AppID 按实际账号填写。

H5 预览：`pnpm dev:h5`。类型检查：`pnpm type-check`。

账号请求发往 `Frentend/.env.development` 的 `VITE_API_BASE_URL`。本机联调时把它改成后端机器地址，例如 `http://192.168.x.x:3000`。微信开发者工具需要勾选不校验合法域名，真机调试时手机要能访问该地址。

`VITE_DATA_SOURCE` 默认是 `mock`。这时图鉴、收录、排行和营地仍用本地数据；注册和登录始终请求后端。改成 `http` 会切换到 HTTP Repository，其中多数业务接口尚未实现。

## 已提供的接口

统一前缀 `/api/v1`。成功和失败都带回 `requestId`。

| 方法 | 路径 | 说明 |
|---|---|---|
| `GET` | `/health` | 进程与数据库状态。数据库不可用时 HTTP 503 |
| `POST` | `/auth/register` | 用户名和密码注册，不签发凭证 |
| `POST` | `/auth/login` | 登录并签发 Bearer access token |
| `GET` | `/users/me` | 当前登录且状态为 ACTIVE 的用户资料 |

字段、错误码和响应信封以 Swagger 和 [Backend/docs/04-api-design.md](Backend/docs/04-api-design.md) 为准。

## 文档

**后端**

| 文档 | 内容 |
|---|---|
| [01-backend-architecture.md](Backend/docs/01-backend-architecture.md) | 架构、模块边界、捕捉与生成流程 |
| [02-technology-stack.md](Backend/docs/02-technology-stack.md) | 选型与成本策略 |
| [03-database-design.md](Backend/docs/03-database-design.md) | 表、关系与约束 |
| [04-api-design.md](Backend/docs/04-api-design.md) | 接口契约 |
| [05-wechat-auth.md](Backend/docs/05-wechat-auth.md) | 微信登录设计 |
| [06-ai-recognition.md](Backend/docs/06-ai-recognition.md) | 植物识别 |
| [07-ai-generation.md](Backend/docs/07-ai-generation.md) | 图像生成 |
| [08-storage-and-async-tasks.md](Backend/docs/08-storage-and-async-tasks.md) | 对象存储与任务 |
| [09-security-design.md](Backend/docs/09-security-design.md) | 安全、隐私与合规 |
| [10-deployment-guide.md](Backend/docs/10-deployment-guide.md) | 测试与部署 |
| [11-local-machine-migration.md](Backend/docs/11-local-machine-migration.md) | 换机与本地库 |

**产品与前端**

| 文档 | 内容 |
|---|---|
| [PRD.md](Frentend/docs/PRD.md) | V1.0 需求 |
| [GAME_DESIGN.md](Frentend/docs/GAME_DESIGN.md) | 玩法 |
| [PLANT_DATA_MODEL.md](Frentend/docs/PLANT_DATA_MODEL.md) | 植物数据模型 |
| [USER_FLOWS.md](Frentend/docs/USER_FLOWS.md) | 用户流程 |
| [MVP_ROADMAP.md](Frentend/docs/MVP_ROADMAP.md) | 里程碑 |
| [DevelopmentInstructions.md](Frentend/docs/DevelopmentInstructions.md) | 前端开发约束 |

## 约定

- 物种归一化、收藏创建、统计和权限由服务端决定。前端 Mock 只服务界面闭环。
- 修改 `Backend/prisma/schema.prisma` 后执行 `pnpm prisma:migrate`。
- 不要提交 `Backend/.env`、微信 AppSecret、AI Key 或对象存储密钥。
- 拍照记录即可。产品不要求用户采摘或破坏真实植物。
- 精确地理位置默认不公开，也不是收录的必要条件。
