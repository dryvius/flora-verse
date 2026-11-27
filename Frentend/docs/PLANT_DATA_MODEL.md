# FloraVerse 植物数据模型

-   文档状态：初稿
-   目标：定义 V1.0 的核心领域实体与关系
-   说明：以下为逻辑模型，不等同于最终 SQL DDL

## 1. 建模原则

1.  公共植物物种数据与用户私有收藏分离。
2.  每次成功收录创建独立植物个体。
3.  每次收录流程有独立记录，可追踪识别和用户纠错。
4.  用户图鉴统计可由事实数据计算，不把统计数字作为唯一事实来源。
5.  植物物种需要支持学名、异名、别名和分类变更。
6.  未来游戏属性应通过扩展模型添加，不污染当前植物学基础数据。

## 2. 实体关系

``` mermaid
erDiagram
    USER ||--o{ PLANT_INSTANCE : owns
    USER ||--o{ PLANT_CAPTURE : creates
    PLANT_SPECIES ||--o{ PLANT_INSTANCE : classifies
    PLANT_SPECIES ||--o{ PLANT_CAPTURE : confirmed_as
    RECOGNITION_TASK ||--o| PLANT_CAPTURE : results_in
    PLANT_INSTANCE ||--o| PLANT_CAPTURE : created_by
    PLANT_SPECIES ||--o{ PLANT_SPECIES_ALIAS : has
```

## 3. 核心实体

### 3.1 PlantSpecies

标准物种主数据。

  字段                   类型建议       说明
  ---------------------- -------------- --------------------------
  id                     UUID/雪花 ID   内部主键
  scientific_name        varchar        接受学名
  chinese_name           varchar        中文标准名
  common_names           JSON/关联表    常用名
  family                 varchar        科
  genus                  varchar        属
  taxonomy_source        varchar        分类数据来源
  taxonomy_version       varchar        分类数据版本
  description            text           简介
  characteristics        JSON           形态特征
  representative_image   varchar        代表图资源 key
  review_status          enum           draft/reviewed/published
  created_at             datetime       创建时间
  updated_at             datetime       更新时间

建议对标准学名建立规范化唯一约束，但需考虑分类修订、异名和数据源差异。更稳妥的方式是引入外部数据源标识与内部稳定
ID。

### 3.2 PlantSpeciesAlias

物种别名表，用于中文别名、英文俗名、异名等检索。

  字段         类型建议   说明
  ------------ ---------- ----------------------
  id           ID         主键
  species_id   ID         关联物种
  alias        varchar    别名
  language     varchar    语言
  alias_type   enum       common/synonym/local
  source       varchar    数据来源

### 3.3 PlantInstance

用户收藏的植物个体。

  字段              类型建议           说明
  ----------------- ------------------ ----------------------
  id                ID                 个体主键
  user_id           ID                 所属用户
  species_id        ID                 关联标准物种
  capture_id        ID                 创建该个体的收录记录
  nickname          varchar nullable   用户昵称
  cover_image_key   varchar            个体封面图资源 key
  note              text nullable      用户备注
  status            enum               active/deleted
  captured_at       datetime           收录时间
  created_at        datetime           创建时间
  updated_at        datetime           更新时间

索引建议： - (user_id, captured_at) - (user_id, species_id) -
(species_id)

### 3.4 PlantCapture

一次收录流程的结果记录。

  字段                  类型建议        说明
  --------------------- --------------- ---------------------------------------
  id                    ID              收录记录 ID
  user_id               ID              用户 ID
  recognition_task_id   ID nullable     识别任务 ID
  species_id            ID              最终确认物种
  instance_id           ID              创建的植物个体
  image_key             varchar         收录照片资源 key
  captured_at           datetime        收录时间
  discovery_type        enum            first/repeat
  confirmation_type     enum            ai_primary/ai_candidate/manual_search
  location_mode         enum            none/coarse/precise
  location_data         JSON nullable   经授权后保存的位置数据
  idempotency_key       varchar         幂等键
  created_at            datetime        创建时间

约束建议： - (user_id, idempotency_key) 唯一。 - instance_id
唯一，避免一条收录记录创建多个个体。 -
收录记录创建后应保留必要审计信息；用户删除收藏时采用软删除或匿名化策略需另行决策。

### 3.5 RecognitionTask

图片识别任务。

  字段            类型建议            说明
  --------------- ------------------- ---------------------------------------------
  id              ID                  任务 ID
  user_id         ID                  发起用户
  image_key       varchar             图片资源 key
  provider        varchar             识别供应商
  model_version   varchar nullable    模型版本
  status          enum                pending/processing/succeeded/failed/expired
  candidates      JSON                候选列表快照
  error_code      varchar nullable    错误码
  error_message   varchar nullable    可安全展示的错误说明
  started_at      datetime nullable   开始时间
  finished_at     datetime nullable   完成时间
  created_at      datetime            创建时间

候选快照用于还原当时识别结果，不能只保存最终物种 ID。

### 3.6 UserSpeciesDiscovery

可选的用户-物种关系表，用于快速判断首次发现和统计。

  字段                  类型建议   说明
  --------------------- ---------- ------------------------
  id                    ID         主键
  user_id               ID         用户
  species_id            ID         物种
  first_instance_id     ID         首次收藏个体
  first_discovered_at   datetime   首次发现时间
  instance_count        int        当前有效个体数，可缓存
  created_at            datetime   创建时间
  updated_at            datetime   更新时间

唯一约束：(user_id, species_id)。

该表属于可维护的派生/聚合数据。若缓存与事实记录不一致，应能从
PlantInstance 和 PlantCapture 重建。

## 4. 统计口径

  指标           计算方式
  -------------- -----------------------------------------------
  已发现物种数   用户有效 PlantInstance 对 species_id 去重计数
  已收藏个体数   用户有效 PlantInstance 数量
  成功收录次数   用户有效成功 PlantCapture 数量
  某物种收藏数   用户该 species_id 的有效个体数量
  首次发现时间   用户该物种最早成功收录时间

删除个体后，统计是否回退、首次发现标签是否保留，需要在产品规则中统一。建议软删除并将"收藏有效状态"和"历史发现事实"分开处理，避免用户删除一株后系统错误地抹去曾经发现过该物种的历史。

## 5. 图片资源模型

建议数据库保存资源 key，而不是直接保存永久公开 URL。

图片资源至少区分： - original：原始上传图 - display：详情展示图 -
thumbnail：列表缩略图

图片处理流程： 1. 上传原图。 2. 服务端校验文件类型和大小。 3.
生成缩略图/展示图。 4. 根据隐私策略保存原图。 5. 通过受控 URL 或 CDN
访问。

具体保留期限、压缩规格、删除和备份策略待确认。

## 6. 未来游戏扩展

不要在 V1.0 的 PlantSpecies 中写入用户个体的战斗数值。

未来可以新增： - PlantGameProfile：物种对应的游戏化设定 -
PlantInstanceGameState：个体等级、经验和状态 - PlantSkill /
PlantInstanceSkill：技能定义和个体技能 - PlantEvolutionRecord：进化历史

这样植物学事实和游戏规则能够独立演进。

## 7. 数据一致性与安全

-   所有 user_id 必须由服务端会话确定，不信任客户端传入值。
-   收录创建应使用事务或可靠一致性方案。
-   幂等键防止网络重试重复创建。
-   公共物种数据只能由管理端或受控导入流程修改。
-   用户只能访问、修改自己的个体和收录记录。
-   删除、纠错和审核操作应有审计记录。
