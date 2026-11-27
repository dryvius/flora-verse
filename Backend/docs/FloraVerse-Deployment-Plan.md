# FloraVerse V1 邀请体验部署实施方案

> 版本：1.0  
> 目标：将 FloraVerse 部署到腾讯云中国大陆环境，供小范围受邀用户通过微信小程序体验。  
> 部署原则：先低成本、单地域、模块化单体；优先保证数据安全、HTTPS、可恢复，不提前引入复杂基础设施。

## 1. 本次部署决策

| 项目 | 决策 |
|---|---|
| 云厂商 | 腾讯云 |
| 部署环境 | 中国大陆地域 |
| 域名 | 新购，完成实名认证和 ICP 备案 |
| 体验目标 | 小范围邀请体验（非公开大规模运营） |
| 后端 | NestJS API |
| 异步进程 | Worker；当前 Worker 仅连接数据库，不领取任务，任务模块完成前可暂不常驻 |
| 数据库 | MySQL 8，初期与 API 同机 Docker 部署 |
| 图片 | 腾讯云 COS，数据库只保存 Asset 元数据和 objectKey |
| 进程管理 | Docker Compose |
| HTTPS | Nginx + Let's Encrypt 或腾讯云证书 |
| 发布 | 第一轮手动部署，稳定后接入 GitHub Actions |

## 2. 当前仓库检查结果与部署影响

本方案基于当前 `main` 分支源码制定，实施前仍应以部署时最新提交为准。

### 2.1 已具备

- `Backend/Dockerfile` 已存在，使用 Node.js 22、pnpm 10.28.0，多阶段构建。
- 镜像运行入口为 `node dist/main.js`；`dist/worker.js` 也由 Nest 构建产出。
- `Backend/.env.example` 已定义生产需要的主要环境变量：数据库、JWT、微信、COS、识别和图像生成 Provider。
- 环境变量通过 Zod 校验，生产环境会拒绝示例占位 JWT 密钥。
- `GET /api/v1/health` 可用于部署后健康检查。
- Prisma 7 使用 `PrismaMariaDb` adapter，数据库连接由 `DATABASE_URL` 提供。
- `Backend/compose.yaml` 已存在，但它是**本地开发配置**：使用示例密码，并将 MySQL 3306 映射到宿主机，不能直接作为生产配置。

### 2.2 上线前必须处理

1. 新增独立的生产 Compose 配置，不复用本地 `compose.yaml`。
2. 生产 MySQL 不映射公网端口，只加入 Docker 内部网络。
3. 为 Docker 镜像增加可执行 `prisma migrate deploy` 的迁移阶段/目标。当前最终 runner 镜像只安装 production dependencies，而 Prisma CLI 在 devDependencies；不能假设进入 runner 后可以直接运行 `pnpm prisma:deploy`。
4. 当前 Worker 启动后只 ping 数据库，并明确不启动任务轮询。识别/生成任务尚未投入使用前，不必为了形式而常驻一个空闲 Worker。
5. 生产关闭 Swagger（`SWAGGER_ENABLED=false` 或不设置）。
6. 小范围邀请前处理登录会话体验：当前登录只签发 15 分钟 access token，没有 refresh token。需要实现 refresh token 轮换，或明确设计过期后重新登录的用户体验。
7. 根 README 表明注册、登录、当前用户资料已接真实 API；图鉴、收录、排行、识别、对象存储等业务 API 尚未全部实现。上线环境可以先部署，但邀请体验范围必须与实际可用功能一致。

## 3. 目标架构

```text
微信小程序（体验版）
  ├── request 合法域名：api.<你的域名>
  ├── uploadFile 合法域名：assets.<你的域名>
  └── downloadFile 合法域名：assets.<你的域名>
                │ HTTPS
                ▼
        腾讯云中国大陆轻量应用服务器
                │
          Nginx :443
                │ reverse proxy
                ▼
        NestJS API :3000（仅容器网络/本机映射）
                │
        ┌───────┴────────┐
        ▼                ▼
    MySQL 8           腾讯云 COS
    私网容器网络       图片二进制文件
        │
        └── Worker（后续任务模块启用时运行）
```

### 3.1 推荐域名规划

假设购买的主域名为 `floraverse.cn`，仅作命名示例，购买前需要检查可注册性：

| 域名 | 用途 | 微信后台配置 |
|---|---|---|
| `api.floraverse.cn` | NestJS API | request 合法域名 |
| `assets.floraverse.cn` | COS 自定义访问域名 | uploadFile、downloadFile 合法域名 |

域名可以按实际购买结果替换。不要把 IP、localhost、临时隧道域名写进正式小程序配置。COS 绑定自定义域名、HTTPS 证书和 CDN（如启用）需按腾讯云当前产品流程配置。

## 4. 腾讯云资源采购建议

### 4.1 第一阶段资源

| 资源 | 建议配置 | 说明 |
|---|---|---|
| 轻量应用服务器 | 2 核 4GB RAM，SSD 约 80–100GB | API、MySQL、Nginx；小流量邀请体验 |
| 操作系统 | Ubuntu 24.04 LTS 或腾讯云支持的稳定 Linux LTS | 统一使用 Linux |
| 地域 | 中国大陆，选择受邀用户主要所在区域 | API 与 COS 尽量同地域 |
| 公网网络 | 按实际流量选择，优先看月流量包和带宽 | 图片尽量走 COS，不经过 API 转发 |
| COS | 同地域标准存储桶 | 先开一个生产桶，按需启用 CDN |
| 域名 | 一个主域名 | API 与资源域名使用子域名 |
| 证书 | Let's Encrypt 或腾讯云证书 | API 与资源访问均使用 HTTPS |

腾讯云当前轻量服务器价格页中，2 核 4GB 的部分套餐标价约为 80–90 元/月（具体随套餐、地域、活动和购买时长变化）。下单时以控制台最终价格为准。对于当前小范围体验，建议先从 2 核 4GB 起步；如果后续识别/生成任务在本机运行或 MySQL 内存压力明显，再升级到 4 核 8GB 或拆分数据库。

### 4.2 暂时不购买

- Redis / 云 Redis
- Kubernetes / TKE
- 多台 API 服务器和负载均衡
- 独立 AI GPU 服务器
- 多套开发、预发、生产集群

邀请体验阶段的目标是验证产品流程，不是提前建设大规模运营架构。

### 4.3 资源边界

- API 和 MySQL 初期同机，适合低并发；必须有异地/云端备份。
- MySQL 仅在 Docker 内部网络开放，安全组不开放 3306。
- COS 保存图片文件；MySQL 保存资产元数据、objectKey、owner、visibility 等。
- 不把用户上传图片保存在容器可写层。
- 图片上传应由后端签发短时授权，客户端直传 COS；不要把 COS SecretId/SecretKey 放进小程序包。

## 5. 域名、实名认证和备案

域名是当前最大的前置事项，建议先确定备案主体，再购买域名和服务器。

### 5.1 先确认备案主体

在腾讯云购买前，先确认以下信息：

- FloraVerse 微信小程序当前注册主体是个人还是企业。
- 域名注册人、腾讯云账号实名主体和备案主体是否能够按当地管局要求匹配。
- 如果未来准备转为企业运营，建议提前考虑域名和小程序主体归属，避免后续转移成本。
- 不要借用他人身份注册域名或备案。

### 5.2 执行顺序

1. 注册/登录腾讯云账号并完成实名认证。
2. 购买主域名并完成域名实名认证。
3. 购买支持 ICP 备案的中国大陆云资源。下单前确认该实例满足腾讯云当前备案资源要求。
4. 等待域名实名认证状态满足备案要求；腾讯云文档提示域名实名认证后通常需等待 3 个自然日再提交备案（非腾讯云注册域名可能需等待 3 个工作日）。
5. 在腾讯云备案控制台发起首次备案，按要求填写主体、服务、域名信息并提交材料。
6. 完成腾讯云初审、短信核验和管局审核。
7. 根据微信公众平台当前要求，完成小程序备案及平台所需的其他主体/服务信息核验。
8. 备案通过后，再将 API 和 COS 自定义域名解析到实际服务。

备案时间由资料完整性和当地管局审核决定，不能按固定天数承诺。备案主体、域名实名信息和材料不一致容易导致驳回。

## 6. 服务器初始化

### 6.1 安全组

公网仅开放：

| 端口 | 来源 | 用途 |
|---|---|---|
| 22 | 个人固定公网 IP（或可信管理出口） | SSH 管理 |
| 80 | 全网 | HTTP 跳转 HTTPS、证书验证 |
| 443 | 全网 | HTTPS API |

不要开放：3306、3000、其他数据库或调试端口。

### 6.2 SSH 与系统

- 使用 SSH 密钥登录，关闭密码登录（确认密钥可用后再关闭）。
- 创建非 root 部署用户。
- 系统包及时更新。
- 配置时区、时间同步和磁盘告警。
- 安装 Docker Engine 与 Docker Compose Plugin。
- 不要在服务器上保存微信 AppSecret、COS SecretKey 到 Git 仓库。

### 6.3 目录建议

```text
/opt/floraverse/
├── app/                 # 部署代码或 compose 配置
├── env/
│   └── production.env   # 仅服务器保存，权限 600
├── mysql/
│   └── data/            # MySQL 持久化数据卷（优先 Docker named volume）
├── backups/
│   ├── mysql/
│   └── metadata/
└── logs/                # 如采用宿主机日志目录
```

生产密钥文件不要放在 Git 工作区，不要通过聊天消息或提交记录传递。

## 7. 生产环境变量

从 `Backend/.env.example` 派生生产配置，按实际服务补齐。下面仅为字段清单，不是可直接使用的密钥：

```dotenv
NODE_ENV=production
PORT=3000
DATABASE_URL=mysql://floraverse_app:<URL_ENCODED_PASSWORD>@mysql:3306/floraverse

JWT_ACCESS_SECRET=<至少32位随机值>
JWT_REFRESH_SECRET=<至少32位随机值>

WECHAT_APP_ID=<小程序AppID>
WECHAT_APP_SECRET=<小程序AppSecret>

STORAGE_PROVIDER=cos
COS_SECRET_ID=<服务端密钥或临时凭证签发所需身份>
COS_SECRET_KEY=<服务端密钥>
COS_BUCKET=<bucket-appid>
COS_REGION=<与服务器匹配的地域>

PLANT_RECOGNITION_PROVIDER=mock
PLANT_RECOGNITION_API_KEY=

IMAGE_GENERATION_PROVIDER=mock
IMAGE_GENERATION_API_KEY=

SWAGGER_ENABLED=false
```

注意：

- 数据库密码若包含特殊字符，必须进行 URL 编码。
- JWT 密钥必须使用密码学安全随机数生成，且与本地环境完全不同。
- COS 最好使用 CAM 最小权限角色；如果业务实现支持 STS，客户端上传使用短时临时密钥。
- 当前微信登录、识别和生成 Provider 尚未全部落地，未实现前不要填入虚构的 Provider 名称并误以为功能已启用。
- 不要把 `production.env` 提交到 Git。

## 8. Docker 生产部署设计

### 8.1 生产 Compose 约束

新增 `Backend/compose.production.yaml`，与本地 `compose.yaml` 分离。至少包含：

- `mysql`：MySQL 8，持久化 volume，健康检查；不配置 `ports`。
- `api`：由现有 Dockerfile 构建，读取生产 env；只绑定 `127.0.0.1:3000:3000`，供宿主机 Nginx 反代。
- `worker`：任务模块启用后使用同一个镜像，覆盖命令为 `node dist/worker.js`；当前不需要为了占位而启动。
- 服务加入独立 bridge network。
- 容器设置 restart policy、日志轮转和合理的资源限制。
- API 依赖 MySQL healthcheck，不仅依赖容器启动顺序。

不要直接复制本地 Compose 的示例密码和 `3306:3306` 映射。

### 8.2 Prisma 迁移

生产发布顺序必须是：

1. 备份当前数据库。
2. 拉取/构建新版本镜像。
3. 执行 `prisma migrate deploy`。
4. 迁移成功后更新 API 容器。
5. 检查 `/api/v1/health` 和关键业务接口。
6. 若应用发布失败，回滚应用镜像；数据库迁移回滚需单独评估，不能简单假设镜像回滚会自动恢复 schema。

**需要先修正 Docker 构建方案：** 当前 Dockerfile 最终 runner 只安装生产依赖，Prisma CLI 属于开发依赖。建议增加独立 migrator build target，或提供一个包含 Prisma CLI 的迁移镜像。不要在生产 runner 内直接执行一个实际不存在的 Prisma CLI 命令。

### 8.3 Nginx

Nginx 在宿主机监听 80/443，将 `api.<domain>` 反向代理到 `127.0.0.1:3000`：

- 80 端口只做 HTTPS 跳转和 ACME 证书验证。
- 443 配置 TLS 证书、TLS 1.2+、合理超时和请求体限制。
- 保留 `Host`、`X-Real-IP`、`X-Forwarded-For`、`X-Forwarded-Proto`。
- 不把 MySQL、Docker socket 或 Swagger 暴露到公网。
- 生产环境默认关闭 Swagger。

具体 Nginx 配置应在域名、证书和服务器 IP 确定后生成，避免把示例域名误部署。

## 9. COS 图片存储

### 9.1 Bucket 规划

建议创建单独生产 Bucket，地域与服务器尽量一致。

- 用户拍摄原图：默认 PRIVATE。
- 用户头像：按产品隐私策略决定 PRIVATE 或受控公开。
- 物种封面等公共图片：可设置 PUBLIC_READ，但禁止 PUBLIC_WRITE。
- 文件 key 使用不可预测的业务 ID/随机 ID，不直接使用用户文件名。
- 校验 MIME、文件大小、图片尺寸；限制可上传格式。
- 不接受客户端直接指定任意 objectKey 或 ownerUserId。

### 9.2 上传流程目标

1. 小程序向 API 请求上传授权。
2. API 校验登录身份、用途、大小和文件类型。
3. API 返回短时上传凭证及受限 objectKey。
4. 小程序直传 COS。
5. 上传完成后通知 API，服务端校验对象并写入 Asset 元数据。
6. 后续识别任务只传 Asset ID，不传永久公开 URL。

### 9.3 域名配置

为 COS 绑定 `assets.<domain>` 自定义域名并配置 HTTPS；如启用 CDN，按腾讯云 COS/CDN 当前流程配置回源和证书。将该域名按微信公众平台要求分别配置为 uploadFile 和 downloadFile 合法域名。

不要把 COS 密钥写入小程序前端。

## 10. 微信小程序邀请体验配置

1. 小程序 AppID 与当前项目配置一致。
2. 在微信公众平台配置服务器域名：
   - request：`https://api.<domain>`
   - uploadFile：`https://assets.<domain>`
   - downloadFile：`https://assets.<domain>`
3. 域名必须满足微信平台当前校验要求，正式环境使用 HTTPS。
4. 在微信开发者工具中构建体验版，上传体验版并邀请指定微信成员体验。
5. 服务端账号仍需注册/登录；体验版成员资格不等同于业务账号权限。
6. 小程序隐私保护指引、用户协议、隐私政策、用户图片处理说明等，在邀请前完成核验。
7. 体验期间仅开放已完成真实 API 的功能；Mock 页面要明确标识为演示数据，避免让测试用户误以为数据已持久化。

## 11. 登录与邀请用户策略

当前账号系统使用用户名/密码，注册登录和当前用户资料已有真实 API；微信登录尚未实现。

小范围体验阶段建议：

- 使用体验版成员限制小程序访问范围。
- 业务账号采用邀请名单或管理员预先发放账号的方式；如果尚未实现邀请白名单，至少不要把“体验版成员”误认为 API 的访问控制。
- 所有业务接口必须校验 access token、用户状态和资源归属。
- 处理 401、token 过期、重复提交和退出登录。
- 15 分钟 access token 过期后要有可理解的续期或重新登录体验；正式邀请前建议实现 refresh token 轮换与撤销。
- 不在日志中记录密码、完整 token、AppSecret、COS 密钥或用户图片内容。

## 12. 备份、监控和故障恢复

### 12.1 数据备份

上线前完成：

- MySQL 每日自动备份。
- 备份保存到服务器以外的 COS/独立存储位置。
- 至少保留最近 7 天日备份；根据数据重要性延长保留周期。
- 备份文件加密并限制访问权限。
- 定期执行恢复演练，确认备份可实际恢复。
- 对用户上传图片设置合理的生命周期与删除策略，不能因清理临时文件误删正式资产。

同机磁盘上的数据库副本不算可靠备份。

### 12.2 最低监控

- 服务器 CPU、内存、磁盘使用率。
- API 进程可用性和 HTTP 5xx。
- MySQL 连接状态、磁盘空间、慢查询。
- COS 存储量和外网流量。
- 备份任务是否成功。
- 后续 Worker 启用后监控任务积压、失败率和耗时。

### 12.3 故障处理

| 故障 | 首要动作 |
|---|---|
| API 无法访问 | 检查 Nginx、容器状态、健康检查和最近发布 |
| MySQL 不可用 | 暂停发布和写入操作，检查磁盘/连接/日志，必要时从备份恢复 |
| 磁盘空间不足 | 优先检查日志、Docker 镜像和备份；禁止直接删除 MySQL 数据目录 |
| 新版本异常 | 回滚到上一个应用镜像，保留数据库现场 |
| COS 上传失败 | 检查 Bucket、域名、CORS/签名、CAM 权限和微信合法域名配置 |

## 13. GitHub Actions 自动部署（第二阶段）

第一轮建议先人工部署，确认容器、域名、证书、迁移和备份都正常，再自动化。

推荐后续流水线：

1. PR：执行后端测试、类型检查和构建。
2. 合并 main：构建不可变版本镜像（以 commit SHA 标记）。
3. 推送到腾讯云 TCR 或其他可从服务器稳定拉取的镜像仓库。
4. GitHub Actions 通过受限 SSH 部署用户触发服务器更新。
5. 服务器拉取指定 SHA 镜像，备份数据库，运行迁移，再更新 API。
6. 健康检查通过才标记部署成功。
7. 失败时保留上一版本镜像并执行应用回滚。

Secrets 放 GitHub Actions Secrets，不写入 workflow 文件。不要把生产 SSH 私钥、云密钥或数据库密码提交到仓库。部署用户权限应尽量收敛。

## 14. 分阶段实施清单

### 阶段 A：账号与合规准备

- [ ] 确认小程序主体与备案主体。
- [ ] 注册腾讯云账号并完成实名认证。
- [ ] 购买并实名认证域名。
- [ ] 购买满足备案条件的中国大陆轻量服务器。
- [ ] 提交 ICP 备案及小程序备案相关申请。
- [ ] 备案通过后配置 DNS。

**阶段验收：** 域名实名状态正常，备案完成，API 与资源域名可解析。

### 阶段 B：仓库生产化

- [ ] 新增生产 Compose 文件。
- [ ] 修正 Dockerfile，提供 Prisma 迁移执行方式。
- [ ] 明确 API、MySQL、Worker 的启动策略。
- [ ] 增加生产 env 校验和启动检查。
- [ ] 关闭生产 Swagger。
- [ ] 明确日志轮转、容器资源限制和健康检查。
- [ ] 运行测试、构建和迁移演练。

**阶段验收：** 在本地或临时 Linux 环境使用生产配置完成构建、迁移、启动、停止和重启。

### 阶段 C：腾讯云环境部署

- [ ] 初始化服务器和 SSH 安全。
- [ ] 安装 Docker、Compose、Nginx。
- [ ] 配置生产密钥文件。
- [ ] 启动 MySQL 并完成首次迁移。
- [ ] 启动 API。
- [ ] 配置 Nginx 与 HTTPS。
- [ ] 创建 COS Bucket、CAM 权限和资源域名。
- [ ] 配置自动备份并执行一次恢复演练。

**阶段验收：** 外网 HTTPS 健康检查成功；MySQL 无公网端口；COS 资源访问策略正确。

### 阶段 D：小程序联调

- [ ] 设置小程序 request/uploadFile/downloadFile 合法域名。
- [ ] 前端生产 API 地址切换为 `https://api.<domain>`。
- [ ] 注册、登录、当前用户资料真机联调。
- [ ] 验证 token 过期、退出登录和异常网络提示。
- [ ] 验证图片上传/下载（COS API 实现完成后）。
- [ ] 验证用户 A 无法读取/修改用户 B 的数据。
- [ ] 明确 Mock 页面和真实数据页面的边界。
- [ ] 上传体验版并邀请小范围成员。

**阶段验收：** 邀请用户可登录并完成已上线的真实功能；数据在重新登录和更换设备后仍符合预期。

### 阶段 E：体验期运营

- [ ] 建立反馈渠道和问题记录。
- [ ] 每日检查服务、备份和错误日志。
- [ ] 监控服务器资源与 COS 用量。
- [ ] 记录用户反馈、核心流程转化和异常。
- [ ] 每次发布保留上一版本镜像和数据库备份。

## 15. 预计成本

以下为预算估算，不是腾讯云最终报价：

| 项目 | 预算口径 |
|---|---|
| 轻量服务器 2C4G | 参考约 80–100 元/月，按下单套餐核实 |
| 域名 | 按后缀和注册年限计费 |
| COS | 按存储容量、请求数和外网流量计费 |
| CDN | 初期可暂缓，图片访问量上升后再评估 |
| 证书 | 可先使用 ACME/Let's Encrypt，或腾讯云证书 |
| 备份 | 取决于备份容量和存储位置 |

初期主要固定成本是服务器和域名；图片流量、AI 调用等按实际用量增长。AI Provider 未接入前保持 Mock，避免体验阶段出现不可控调用成本。

## 16. 关键风险与上线门槛

以下事项必须在邀请用户前解决或明确限制：

1. **备案与域名：** 未完成备案和微信平台域名配置，不进入真实小程序网络联调。
2. **Token 续期：** 15 分钟 access token 且无 refresh token，会影响体验；必须补齐续期或明确重新登录流程。
3. **数据真实程度：** 当前图鉴、收录、排行等仍有 Mock 数据，不能对外宣称这些数据已真实云端同步。
4. **图片存储：** 当前 Asset 数据模型已预留 COS，但上传 API 尚未全部实现；实现前不要在小程序中暴露 COS 长期密钥。
5. **数据库恢复：** 备份未恢复演练前，不邀请真实用户录入重要数据。
6. **Worker：** 当前 Worker 不消费任务，不能把“进程启动成功”描述成异步识别/生成已上线。
7. **安全：** 数据库端口、调试端口和 Swagger 不得直接暴露公网。

## 17. 官方资料

- [腾讯云 ICP 备案流程](https://cloud.tencent.com/document/product/243/18909)
- [腾讯云 ICP 备案条件与常见问题](https://cloud.tencent.com/document/product/243/19628)
- [腾讯云备案域名要求](https://cloud.tencent.com/document/faq/243/19627)
- [腾讯云轻量应用服务器价格总览](https://cloud.tencent.com/document/product/1207/73452)
- [腾讯云 COS 产品文档](https://cloud.tencent.com/document/product/436)

> 备案、微信小程序平台配置、云产品价格和合规要求可能变化。实际操作以腾讯云控制台、工信部备案系统和微信公众平台当时的官方规则为准。
