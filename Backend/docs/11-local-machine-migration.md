# 11 - 换电脑时的本地环境迁移

本地联调的前后端代码走 Git。MySQL 跑在本机 Docker 里，库里的行数据不在仓库中。换电脑时重新拉起一个空库，再用仓库里的 Prisma 迁移建表。只有需要保留当前这台机器上已经写入的联调数据时，才额外导出一份 SQL。

生产部署见 [10-deployment-guide.md](./10-deployment-guide.md)。本文只覆盖本机开发环境。

## 1. 什么进 Git，什么留在本机

| 内容 | 位置 | 是否提交 |
|---|---|---|
| 表结构 | `prisma/schema.prisma`、`prisma/migrations/` | 提交 |
| 演示数据脚本 | `prisma/seed.ts`，命令 `pnpm db:seed` | 提交 |
| MySQL 启动方式 | `compose.yaml` | 提交 |
| 环境变量模板 | `.env.example` | 提交 |
| 真实环境变量 | `Backend/.env` | 不提交，已在 `.gitignore` |
| 数据库文件 | Docker 卷 `mysql_data`，挂载到容器内 `/var/lib/mysql` | 不提交，只存在当前电脑的 Docker 里 |
| 前端接口地址 | `Frentend/.env.development` 的 `VITE_API_BASE_URL` | 换电脑后改成新机器地址 |

`git push` 带不走 `mysql_data`。新电脑上的 Docker 是空的，需要自己再起一次 MySQL。

## 2. 新电脑：空库重新建（日常换机用这条）

新机器安装 Node.js 22、pnpm 10 和 Docker Desktop，拉下仓库后在 `Backend` 目录执行：

```powershell
Copy-Item .env.example .env
pnpm install
pnpm db:up
pnpm prisma:migrate
pnpm db:seed
pnpm start:dev
```

各步的结果：

1. `Copy-Item` 按模板生成 `.env`。其中 `DATABASE_URL` 与 `compose.yaml` 的本地账号一致：`mysql://app:app_password@localhost:3306/floraverse`。
2. `pnpm db:up` 启动容器 `floraverse-mysql`（MySQL 8），并新建空的 `mysql_data` 卷。
3. `pnpm prisma:migrate` 按 `prisma/migrations/` 建表。
4. `pnpm db:seed` 写入首发物种、演示用户和示例个体。
5. `pnpm start:dev` 启动 API。健康检查：`http://localhost:3000/api/v1/health`。

前端在 `Frentend` 目录执行 `pnpm install` 后启动。把 `.env.development` 里的 `VITE_API_BASE_URL` 改成新电脑当前的地址（本机可用 `http://localhost:3000`，局域网调试则换成新机器的局域网 IP）。旧电脑上的 IP 不能继续用。

这条路径得到的是结构正确、带演示数据的新库。旧电脑上联调时手工插入的账号和业务记录不会出现。

## 3. 需要保留现有联调数据时

表结构仍然以迁移文件为准，不用从旧库反推 schema。要搬的只是行数据。

### 3.1 旧电脑导出

确认容器在运行（`pnpm db:up`），在 `Backend` 目录执行：

```powershell
docker exec floraverse-mysql mysqldump -uapp -papp_password --databases floraverse --single-transaction --routines --triggers > floraverse-local.sql
```

`floraverse-local.sql` 用 U 盘或网盘拷到新电脑。不要提交到 Git。本地库里会有登录密码哈希和联调过程中的用户数据。

### 3.2 新电脑导入

先只启动空的 MySQL，不要先跑迁移：

```powershell
Copy-Item .env.example .env
pnpm install
pnpm db:up
```

等 `floraverse-mysql` 健康后导入。导入文件里已经包含库、表和数据：

```powershell
Get-Content floraverse-local.sql | docker exec -i floraverse-mysql mysql -uapp -papp_password
```

导入完成后直接 `pnpm start:dev`。不要对这份已经导入的库再执行一次会改历史的迁移初始化。之后 schema 有新变更，仍用 `pnpm prisma:migrate` 往前推进。

前端地址的处理与第 2 节相同。

## 4. 两条路径怎么选

| 情况 | 做法 |
|---|---|
| 只需要能联调，演示数据够用 | 第 2 节：`prisma:migrate` + `db:seed` |
| 必须保留当前库里的账号、捕捉记录等行数据 | 第 3 节：`mysqldump` 导出再导入 |

账号密码以 `compose.yaml` 和 `.env.example` 为准，仅用于本机。生产环境不要沿用这组密码，也不要把 3306 暴露到公网。
