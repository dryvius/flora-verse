# 10 - 本地开发与国内云部署

## 1. 开发阶段原则

先本地完成后端闭环，再购买云资源。第一阶段不需要域名、CVM、COS 生产桶或 Redis。

## 2. 本地依赖

建议本地安装：
- Node.js LTS
- npm / pnpm（二选一并在仓库统一）
- Docker Desktop
- Git
- IDE / Cursor

MySQL 使用 Docker Compose 启动，避免开发者机器直接安装和维护数据库服务。

## 3. 本地环境变量

提供 `.env.example`，不要提交真实 `.env`。

示例变量：
```dotenv
NODE_ENV=development
PORT=3000
DATABASE_URL="mysql://app:app_password@localhost:3306/floraverse"

JWT_ACCESS_SECRET="replace-me"
JWT_REFRESH_SECRET="replace-me"

WECHAT_APP_ID=""
WECHAT_APP_SECRET=""

STORAGE_PROVIDER="local"
COS_SECRET_ID=""
COS_SECRET_KEY=""
COS_BUCKET=""
COS_REGION=""

PLANT_RECOGNITION_PROVIDER="mock"
PLANT_RECOGNITION_API_KEY=""

IMAGE_GENERATION_PROVIDER="mock"
IMAGE_GENERATION_API_KEY=""
```

实际项目应使用强随机密钥，并通过密钥管理方式配置生产环境变量。

## 4. Docker Compose 本地 MySQL

示例仅用于本地开发：

```yaml
services:
  mysql:
    image: mysql:8
    container_name: floraverse-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: local_root_password
      MYSQL_DATABASE: floraverse
      MYSQL_USER: app
      MYSQL_PASSWORD: app_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-plocal_root_password"]
      interval: 5s
      timeout: 3s
      retries: 20

volumes:
  mysql_data:
```

生产环境不要沿用示例密码，也不要把数据库端口直接暴露到公网。

## 5. 初始化建议

具体命令以当前 NestJS 和 Prisma 官方文档为准。典型步骤：
1. 创建 NestJS 项目。
2. 安装 Prisma 与 MySQL Driver。
3. 配置 schema.prisma 和 DATABASE_URL。
4. 编写初始 schema。
5. 生成 migration。
6. 执行 migration。
7. 生成 Prisma Client。
8. 配置 Swagger。
9. 实现 health endpoint。
10. 添加单元测试和 e2e 测试。

本仓库第一阶段已落地上述步骤，日常命令以 [../README.md](../README.md) 为准。Prisma ORM 7 把连接串放在 `prisma7.config.ts`，`schema.prisma` 只声明 `provider = "mysql"`。当前 schema 不含领域表；用户、物种和任务模型按 `03-database-design.md` 在后续阶段引入。健康检查为 `GET /api/v1/health`，Swagger 为 `/api/docs`。

## 6. 国内云部署拓扑

MVP 可先使用单地域：
- 域名和 ICP 备案。
- 一台 CVM。
- Nginx + HTTPS。
- NestJS API 容器。
- NestJS Worker 容器。
- 托管 MySQL（优先）或短期同机 MySQL。
- COS 存储桶。
- 备份与告警。

数据库只允许应用服务器私网访问；SSH 使用密钥并限制来源 IP；安全组只开放必要端口（通常 80/443，以及受限管理端口）。

## 7. 小程序网络配置

- API 使用已备案并配置 HTTPS 的业务域名。
- 在微信公众平台配置 request 合法域名。
- 上传域名配置到 uploadFile 合法域名。
- 下载域名配置到 downloadFile 合法域名。
- 相关域名必须满足微信平台当前要求。
- 不要在生产小程序中使用 localhost、内网 IP 或临时调试域名。

具体要求以微信公众平台最新规则为准。

## 8. 数据备份与恢复

上线前必须：
- 配置自动备份。
- 明确备份保留周期。
- 定期执行恢复演练。
- 备份数据库与关键对象存储数据/元数据。
- 记录 schema migration 版本。
- 确认删除操作和对象生命周期策略不会误删业务资产。

## 9. 监控

V1 至少监控：
- API 5xx 比例。
- API 延迟。
- 数据库连接数和慢查询。
- Worker backlog（待处理任务数量）。
- 任务成功率、失败率、平均耗时。
- AI 调用次数和成本。
- COS 存储量和流量。
- 服务器 CPU、内存、磁盘。

## 10. 上线前检查

- [ ] `.env` 不进入 Git。
- [ ] 生产密钥已更换。
- [ ] 数据库无公网开放端口。
- [ ] HTTPS 有效。
- [ ] 微信合法域名配置完成。
- [ ] 认证和资源归属测试通过。
- [ ] AI 额度和熔断策略生效。
- [ ] 数据库备份及恢复已验证。
- [ ] 图片访问权限符合隐私策略。
- [ ] 隐私政策、用户协议和平台审核要求完成核验。
