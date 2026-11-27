# 08 - 对象存储与异步任务基础设施

## 1. 文件存储原则

- 图片二进制存对象存储，不放 MySQL。
- MySQL 记录 Asset 元数据和对象 key。
- 上传凭证短期有效、最小权限、限定 object key。
- 默认私有存储；公开游戏素材通过受控 CDN/公开域名策略发布。
- 原始拍摄图片与生成结果分开管理。
- 不把永久可访问的 COS Secret 暴露给小程序。

## 2. 上传流程

1. 小程序请求 `POST /assets/upload-credentials`。
2. 服务端认证用户并校验文件用途、大小、类型。
3. 服务端生成随机 objectKey。
4. 服务端签发短期上传凭证。
5. 小程序直传 COS。
6. 小程序请求 `POST /assets/complete-upload`。
7. 服务端验证对象确实存在、大小和类型符合要求。
8. 服务端创建 Asset 记录并返回 assetId。

文件名不可信；服务端生成路径。不能只信任客户端传入的 MIME type。

## 3. 任务表公共字段

RecognitionTask / GenerationTask 可复用任务基础字段：
- id
- taskType
- userId
- status
- attempts
- maxAttempts
- availableAt
- lockedAt
- lockedBy
- leaseExpiresAt
- lastErrorCode
- createdAt
- startedAt
- finishedAt

可以采用一张统一任务表，也可以识别和生成分别建表。V1 如果两类任务生命周期差异明显，建议分别建表，减少 JSON 字段和复杂状态耦合。

## 4. Worker 可靠性

- 任务领取必须原子化。
- 任务执行采用至少一次（at-least-once）思路。
- 业务副作用必须幂等。
- Worker 崩溃后通过租约超时恢复任务。
- 失败任务有限重试并使用退避。
- 超过最大次数进入 FAILED，不无限重试。
- 记录错误码和脱敏错误摘要。
- 对任务执行时间设置上限。

不能承诺 exactly-once。外部 AI 调用可能在网络超时前已成功，必须利用供应商请求 ID、查询接口或幂等能力尽量避免重复扣费。

## 5. Worker 与 API 启动

建议提供两个启动命令：
- `start:prod`：启动 API。
- `start:worker`：启动 Worker。

本地开发可以只运行一个 Worker 进程。线上根据任务量增加 Worker 数量，但必须保证任务锁和租约逻辑正确。

## 6. 未来升级 BullMQ

将任务调度抽象为内部接口，例如：
- enqueue(task)
- consume(handler)
- retry(task)
- cancel(task)

V1 实现 MySqlTaskQueue；未来实现 BullMqTaskQueue。业务模块不应直接依赖 BullMQ API。

## 7. 生命周期与清理

- 临时上传文件定期清理。
- 未完成任务设置过期策略。
- 失败任务保留必要诊断信息。
- 原始图片按隐私政策和产品需要设置保存期限。
- 生成结果、发布素材和用户资产的删除策略应区分。
- 删除数据库 Asset 记录前，确认对象存储清理和引用关系。
