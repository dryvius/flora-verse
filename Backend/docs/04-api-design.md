# 04 - REST API 设计规范

## 1. 基础规范

- Base URL：`https://api.example.com/api/v1`
- 传输：HTTPS
- 数据格式：JSON
- 字符编码：UTF-8
- 时间：ISO 8601 UTC
- ID：不透明字符串，客户端不得解析内部结构。
- 分页：默认 `page` + `pageSize`；大数据列表可升级 cursor pagination。
- 认证：`Authorization: Bearer <accessToken>`。

## 2. 统一成功响应

```json
{
  "code": "OK",
  "message": "success",
  "data": {},
  "requestId": "req_xxx"
}
```

分页示例：

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "items": [],
    "page": 1,
    "pageSize": 20,
    "total": 0
  },
  "requestId": "req_xxx"
}
```

错误响应：

```json
{
  "code": "SPECIES_NOT_FOUND",
  "message": "Plant species not found",
  "details": {},
  "requestId": "req_xxx"
}
```

不要将数据库异常、堆栈、供应商密钥或内部 URL 返回给客户端。

## 3. API 清单

### Auth / User

| Method | Path | 说明 |
|---|---|---|
| POST | /auth/login | 用户名密码登录，签发 15 分钟 access token |
| POST | /auth/wechat/mini-program | 微信登录 |
| POST | /auth/refresh | 刷新 Token |
| POST | /auth/logout | 登出/撤销会话 |
| GET | /users/me | 当前用户 |
| PATCH | /users/me | 更新允许修改的资料 |

#### 用户名密码登录

`POST /api/v1/auth/login`

请求体：

```json
{
  "username": "摘星重现",
  "password": "Flora@2026"
}
```

用户名先 `trim` 再做 NFC，规则与注册相同。密码不去空格、不改大小写。数据库用户名唯一索引使用 `utf8mb4_unicode_ci`，因此大小写不同的拉丁用户名会命中同一条密码身份。

成功时 HTTP 200。响应仍由统一信封包裹，`data` 为：

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 900,
  "username": "摘星重现",
  "user": {
    "id": "usr_xxx",
    "nickname": "星辰",
    "avatarAssetId": null,
    "status": "ACTIVE",
    "createdAt": "2026-11-26T06:00:00.000Z"
  }
}
```

后续请求使用 `Authorization: Bearer <accessToken>`。Swagger security scheme 名称是 `access-token`。

JWT：

- 签名密钥只使用 `JWT_ACCESS_SECRET`。
- 有效期固定 900 秒，与 `expiresIn` 一致。
- Payload 只有 `sub`，值为内部 `User.id`。
- 不包含用户名、密码、密码哈希或用户资料。
- 不签发 refresh token，不读取 `JWT_REFRESH_SECRET`。

`JwtAuthGuard` 只验证 JWT，不查询数据库，也不检查用户状态：

1. 只读取 `Authorization` 请求头中的 `Bearer <accessToken>`，不读取 query、cookie 或 body。
2. 使用 `AuthModule` 里已经注册的 `JwtService.verify()`，算法限定为 `HS256`。
3. `sub` 必须是非空字符串，并写入 `request.currentUser.id`。完整用户资料不放进请求上下文。
4. `@CurrentUser()` 读取该上下文。上下文不存在时返回 401 `UNAUTHORIZED`。

Guard 通过 Controller 或 Handler 上的 `@UseGuards(JwtAuthGuard)` 按需启用，不注册为全局 `APP_GUARD`。健康检查、注册和登录因此保持匿名。

受保护的用户业务接口在 Guard 通过后，还必须调用 `UsersService.requireActiveById(currentUser.id)`。只挂 Guard 只能证明 token 签名有效，不能证明用户仍然存在并且状态为 `ACTIVE`。

错误：

| HTTP | code | 场景 |
|---|---|---|
| 400 | `VALIDATION_ERROR` | 缺字段、类型错误或空字符串 |
| 400 | `INVALID_USERNAME` | 用户名不符合注册规则 |
| 400 | `INVALID_PASSWORD` | 密码不符合注册规则 |
| 401 | `INVALID_CREDENTIALS` | 身份不存在、密码哈希为空或密码不匹配。这三种情况使用同一错误 |
| 403 | `USER_NOT_ACTIVE` | 密码正确，但用户状态不是 `ACTIVE` |

#### 当前用户

`GET /api/v1/users/me`

请求头：`Authorization: Bearer <accessToken>`。服务端只使用 JWT 的 `sub` 作为 `User.id` 查询，不接受客户端传入的 `userId`，也不按用户名识别当前用户。

成功时 HTTP 200。`data` 为当前 `ACTIVE` 用户资料：

```json
{
  "id": "usr_xxx",
  "nickname": "星辰",
  "avatarAssetId": null,
  "status": "ACTIVE",
  "createdAt": "2026-11-26T06:00:00.000Z"
}
```

查询使用用户主键，字段与登录响应中的 `user` 相同。响应不包含 `passwordHash`、`AuthIdentity`、`providerSubject`、`updatedAt` 或 `deletionRequestedAt`。

用户被改为非 `ACTIVE` 后，登录时签发的 access token 在过期前访问本接口会失败。当前没有 Session 表，不能按单枚 token 提前作废；是否可用以这次数据库读取为准。`DISABLED`、`PENDING_DELETION` 和 `DELETED` 使用同一个错误。

错误：

| HTTP | code | 场景 |
|---|---|---|
| 401 | `UNAUTHORIZED` | 缺少 Authorization，或 `sub` 对应的用户不存在 |
| 401 | `INVALID_TOKEN` | Token 格式错误、签名错误，或 `sub` 缺失、为空、不是字符串 |
| 401 | `TOKEN_EXPIRED` | Token 已过期 |
| 401 | `USER_NOT_ACTIVE` | 用户状态不是 `ACTIVE` |

登录接口在密码正确但用户非活跃时仍返回 403 `USER_NOT_ACTIVE`。本接口返回 401，因为此时出示的是 access token。

接入新的受保护用户接口时：

1. 在 handler 上添加 `@UseGuards(JwtAuthGuard)` 和 `@ApiBearerAuth('access-token')`。
2. 用 `@CurrentUser()` 取得 `{ id }`。
3. 调用 `requireActiveById(currentUser.id)` 后再执行业务读写。

### Taxonomy / Species

| Method | Path | 说明 |
|---|---|---|
| GET | /taxonomy/tree | 科属分类树 |
| GET | /species | 物种列表、筛选、搜索 |
| GET | /species/:speciesId | 物种详情 |

### Assets

| Method | Path | 说明 |
|---|---|---|
| POST | /assets/upload-credentials | 获取短期上传凭证 |
| POST | /assets/complete-upload | 校验上传完成并登记资产 |
| GET | /assets/:assetId | 查询当前用户可访问的资产元数据 |

### Recognition / Capture

| Method | Path | 说明 |
|---|---|---|
| POST | /ai/recognition-tasks | 创建植物识别任务 |
| GET | /ai/recognition-tasks/:taskId | 查询识别任务 |
| POST | /captures | 确认捕捉 |
| GET | /captures/me | 我的捕捉记录 |

### Collection / Instance

| Method | Path | 说明 |
|---|---|---|
| GET | /collections/me | 我的图鉴 |
| GET | /collections/me/stats | 图鉴统计 |
| GET | /instances/me | 我的植物个体 |
| GET | /instances/:instanceId | 植物个体详情 |

### Ranking / Environment

| Method | Path | 说明 |
|---|---|---|
| GET | /rankings/species-count | 物种收录排行 |
| GET | /rankings/power | 植物战力排行 |
| GET | /environment/current | 当前营地环境信息 |

### Generation

| Method | Path | 说明 |
|---|---|---|
| POST | /ai/generation-tasks | 创建实时生成任务 |
| GET | /ai/generation-tasks/:taskId | 查询生成任务 |
| POST | /ai/generation-tasks/:taskId/cancel | 尝试取消任务 |

## 4. 创建生成任务示例

请求：

```http
POST /api/v1/ai/generation-tasks
Authorization: Bearer <token>
Idempotency-Key: <client-generated-unique-key>
Content-Type: application/json
```

```json
{
  "scene": "PLANT_PORTRAIT",
  "speciesId": "species_xxx",
  "growthStage": "MATURE",
  "styleId": "floraverse_default"
}
```

响应：

```json
{
  "code": "OK",
  "message": "accepted",
  "data": {
    "taskId": "gen_xxx",
    "status": "PENDING",
    "pollAfterMs": 2000
  },
  "requestId": "req_xxx"
}
```

## 5. 查询任务示例

```json
{
  "code": "OK",
  "message": "success",
  "data": {
    "taskId": "gen_xxx",
    "status": "SUCCEEDED",
    "progress": 100,
    "result": {
      "assetId": "asset_xxx",
      "imageUrl": "短期有效或公开的受控访问地址"
    },
    "error": null
  },
  "requestId": "req_xxx"
}
```

progress 只有在供应商或 Worker 能可靠提供时才返回；否则不应伪造精确进度，可返回阶段状态。

## 6. 状态码约定

| HTTP | 使用场景 |
|---|---|
| 200 | 查询/更新成功 |
| 201 | 资源创建成功 |
| 202 | 异步任务已接受 |
| 400 | 参数错误 |
| 401 | 未认证或 Token 无效 |
| 403 | 无权限 |
| 404 | 资源不存在或不可见 |
| 409 | 幂等冲突、状态冲突 |
| 413 | 上传内容过大 |
| 429 | 请求频率或配额超限 |
| 500 | 未预期服务端错误 |
| 502/503 | 上游 AI 或依赖服务不可用 |

## 7. 接口契约原则

- DTO 必须做运行时校验。
- 不直接将 Prisma Model 作为 API 返回类型。
- 通过 Response DTO 控制字段。
- 关键写接口支持幂等。
- Swagger 描述鉴权、请求、响应、错误码。
- 前端 API 类型可由 OpenAPI 生成或人工同步，避免复制不一致的结构。
