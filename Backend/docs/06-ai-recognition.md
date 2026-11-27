# 06 - 植物图像识别设计

## 1. 目标

用户拍摄真实植物后，FloraVerse 返回候选物种；用户确认后才创建捕捉记录和植物个体。

识别结果不是捕捉结果。AI 候选不得直接写入用户收藏。

## 2. Provider 抽象

```ts
export interface PlantRecognitionProvider {
  recognize(input: {
    imageUrl: string;
    language?: string;
    locationHint?: {
      countryCode?: string;
      region?: string;
    };
  }): Promise<PlantRecognitionResult>;
}

export interface PlantRecognitionResult {
  provider: string;
  model?: string;
  candidates: Array<{
    scientificName: string;
    commonNames?: string[];
    confidence?: number;
    externalTaxonomyId?: string;
  }>;
  rawReferenceId?: string;
}
```

Provider Adapter 负责把供应商响应映射成内部统一结构。不要将供应商原始 JSON 直接暴露给前端。

## 3. 任务流程

1. 用户上传原始植物图片。
2. 服务端校验 Asset 属于当前用户且可用于识别。
3. 创建 RecognitionTask（PENDING）。
4. Worker 领取任务并更新 PROCESSING。
5. 调用植物识别 Provider。
6. 规范化候选名称和外部 taxonomy ID。
7. 映射到 FloraVerse PlantSpecies。
8. 保存候选和置信度，更新 SUCCEEDED。
9. 前端展示候选，用户确认。
10. 服务端事务创建 PlantCapture 和 PlantInstance。

## 4. 物种映射

建立独立的外部物种映射表，例如：
- id
- speciesId
- source（PLANTNET / PLANT_ID / GBIF / POWO 等）
- externalId
- externalScientificName
- verifiedAt

匹配优先级：
1. 已验证的外部 ID 映射。
2. 标准化学名精确匹配。
3. 人工审核后的别名映射。
4. 无法匹配时返回“暂未收录/需要进一步确认”。

不要仅凭中文俗名自动认定物种，因为俗名可能存在歧义。

## 5. 置信度策略

置信度是供应商模型输出，不应直接视为真实概率或准确率。

产品策略可按验证集结果制定：
- 高置信候选：优先展示，但仍由用户确认。
- 中低置信候选：展示多个候选和补拍建议。
- 无法匹配：允许用户放弃捕捉或提交待审核记录。

具体阈值必须通过中国植物样本测试确定，不在代码中随意写死未经验证的 0.8 等阈值。

## 6. 测试集

第一轮建立 100–300 张人工标注图片：
- 中国常见植物。
- 叶、花、果实、树皮等不同部位。
- 不同季节和生长阶段。
- 不同光照、距离、背景。
- 易混淆物种。
- 非植物图片（用于拒识测试）。

指标：
- Top-1 accuracy。
- Top-3 recall。
- 科属准确率。
- 无法识别率。
- 响应耗时。
- 单次成本。
- 中国大陆网络可用性。

## 7. 候选服务验证

Pl@ntNet、Plant.id 和国内视觉模型可作为候选，不应在未测试前写成最终选型。需要核实 API 可用性、套餐、配额、中文支持、数据使用条款、商业授权和大陆网络情况。

## 8. 失败处理

- Provider timeout：标记可重试错误，但限制重试次数。
- Rate limit：根据供应商 Retry-After 处理。
- Invalid image：终止任务并返回用户可理解错误。
- Provider unavailable：保留任务记录，稍后重试或失败。
- Species unmatched：任务可成功，但候选映射状态标记为 UNMAPPED。
