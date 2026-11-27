# FloraVerse 后端工程文档

> 版本：V1.0  
> 目标：为 FloraVerse 微信小程序建立可运行、低成本、可扩展的后端基础。  
> 主要技术：NestJS、TypeScript、MySQL、Prisma、对象存储、AI Provider 抽象。

## 文档索引

| 文档 | 内容 |
|---|---|
| [01-backend-architecture.md](./01-backend-architecture.md) | 总体架构、模块边界、核心流程 |
| [02-technology-stack.md](./02-technology-stack.md) | 技术选型、版本与成本策略 |
| [03-database-design.md](./03-database-design.md) | 核心实体、关系、字段与约束 |
| [04-api-design.md](./04-api-design.md) | API 规范、接口清单、响应格式 |
| [05-wechat-auth.md](./05-wechat-auth.md) | 微信登录、会话与权限 |
| [06-ai-recognition.md](./06-ai-recognition.md) | 植物识别服务设计 |
| [07-ai-generation.md](./07-ai-generation.md) | 实时触发图像生成架构 |
| [08-storage-and-async-tasks.md](./08-storage-and-async-tasks.md) | 图片存储、任务表、Worker |
| [09-security-design.md](./09-security-design.md) | 安全、隐私、反作弊与合规检查 |
| [10-deployment-guide.md](./10-deployment-guide.md) | 本地开发、测试与国内云部署 |
| [11-local-machine-migration.md](./11-local-machine-migration.md) | 换电脑时重建本地 MySQL，或导出联调数据 |

## 当前架构决策

1. 采用模块化单体（Modular Monolith），不采用微服务。
2. 前后端统一使用 TypeScript；后端使用 NestJS。
3. MySQL 是核心业务数据的唯一可信来源。
4. Prisma 负责数据库访问与迁移。
5. 图片文件存储在对象存储中，数据库仅保存元数据和对象 key。
6. AI 能力通过 Provider 接口隔离供应商。
7. AI 图像生成采用“用户触发、后台执行、前端轮询任务状态”的方式。
8. V1 不强制引入 Redis、BullMQ、Kubernetes 或独立 AI 服务器。
9. 任务先使用 MySQL 持久化队列；未来可迁移到 BullMQ，业务接口尽量保持不变。
10. 所有捕捉、经验、属性、战力等关键游戏数据由服务端计算和校验。

## Cursor 使用原则

- 一次只实现一个模块或一组紧密相关的接口。
- 先阅读本目录文档，再修改代码。
- 先定义 DTO、数据模型和接口契约，再实现业务逻辑。
- 每个模块必须包含必要的单元测试或集成测试。
- 不允许为了“方便”把业务规则写在 Controller 中。
- 不允许把 AppSecret、AI API Key、COS 密钥写入前端或提交到 Git。
- 修改数据库 schema 后，必须生成并执行 Prisma migration。
- 每个阶段完成后更新 README 和相关文档。

## 实施进度

| 阶段 | 状态 | 说明 |
|---|---|---|
| 1. Backend Bootstrap | 已完成 | NestJS 项目、TypeScript、ESLint、Docker MySQL、Prisma 7、环境变量、Swagger、Health Check、基础目录。 |
| 2.1 核心领域模型 | 已完成 | 领域表已建。战力、品质、属性快照、分类学、位置、注销和搜索决策已收敛。 |
| 2.2.1 用户数据访问 | 已完成 | UsersModule 提供按内部 ID 读取资料和更新昵称。 |
| 2.2.2.4 用户登录 | 已完成 | `POST /api/v1/auth/login` 用用户名和密码签发 15 分钟 access token。不签发 refresh token。 |
| 2.2.2.5 当前用户身份 | 已完成 | `JwtAuthGuard` 按路由验证 access token，并把 `sub` 写入当前用户上下文。`GET /api/v1/users/me` 再通过 `requireActiveById()` 确认用户为 ACTIVE。 |

应用根目录是 `Backend/`，启动说明见 [../README.md](../README.md)。

## 建议实施顺序

1. NestJS 项目初始化、配置、日志、Swagger、Prisma。已完成。
2. 用户与微信登录。
3. 植物分类、物种主数据。
4. 捕捉、植物个体、图鉴统计。
5. 现有四个页面接入真实 API。
6. 图片资产上传与任务基础设施。
7. 植物识别 Provider。
8. 实时触发的图像生成 Provider。
9. 排行榜、环境属性、监控与部署。

## 重要说明

本目录是工程设计基线，不代表所有第三方服务已经选定或完成验证。植物识别供应商、图像生成供应商、价格、模型能力、商用授权、国内可用性及合规要求，均应在正式接入前通过官方文档和真实样本验证。
