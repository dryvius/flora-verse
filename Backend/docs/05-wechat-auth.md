# 05 - 微信小程序登录与用户认证

## 1. 登录流程

1. 小程序调用 `wx.login()` 获取临时 `code`。
2. 小程序将 code 发送到 FloraVerse `POST /auth/wechat/mini-program`。
3. NestJS 服务端使用 AppID、AppSecret 和 code 调用微信官方登录凭证接口。
4. 服务端取得 openid；在满足条件时可取得 unionid。
5. 通过 AuthIdentity 查找用户；不存在则创建 User 和 AuthIdentity。
6. FloraVerse 签发自己的 access token 和 refresh token。
7. 小程序安全保存会话凭证，并在后续请求中携带 access token。

## 2. 安全原则

- AppSecret 只能存放在服务端环境变量或密钥管理服务中。
- 不允许将 AppSecret 打包进小程序。
- openid 不作为业务主键，也不作为 API Bearer Token。
- Token 必须有过期时间；Refresh Token 应支持轮换和撤销。
- 生产环境避免在日志中打印 code、openid、Token。
- 登录接口限流，必要时增加设备/风险控制。
- 用户禁用、注销后应撤销相关会话。

## 3. 表设计

AuthIdentity：
- id
- userId
- provider
- providerSubject（openid）
- unionId
- createdAt

Session（建议使用持久化会话表，而非只签发长期 JWT）：
- id
- userId
- refreshTokenHash
- expiresAt
- revokedAt
- createdAt
- lastUsedAt

数据库只保存 refresh token 的哈希，不保存明文 refresh token。

## 4. Token 建议

- Access Token：短有效期，例如 15–30 分钟，具体根据产品体验和安全要求确定。
- Refresh Token：更长有效期，使用随机高熵值，服务端保存哈希并支持轮换。
- Token 过期后使用 refresh 接口换取新 Token。
- 登出时撤销服务端 Session。

不要将 access token 设置为永不过期。

## 5. 微信登录异常

需要处理：
- code 无效或过期。
- 微信服务超时。
- AppID/AppSecret 配置错误。
- 用户首次登录。
- 同一微信身份重复登录。
- 账号被禁用。
- 微信接口返回异常。

向客户端返回稳定的业务错误码，不透传微信原始错误详情或密钥信息。

## 6. 用户资料

昵称、头像等资料应按微信平台当前规则和用户授权流程获取。不要假设登录接口会自动提供用户昵称和头像。

用户资料更新应限制字段白名单，客户端不得修改：
- userId
- openid
- level
- experience
- collection stats
- power
- role / permissions

## 7. 官方文档核验

实现时以微信公众平台最新的 `wx.login`、登录凭证校验及用户隐私保护文档为准。接口地址、字段和平台规则可能调整，不要只依赖旧教程。
