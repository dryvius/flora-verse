<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import ErrorState from '@/components/common/ErrorState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import PlantSpecimenSheet from '@/components/plant/PlantSpecimenSheet.vue'
import { usePageState } from '@/composables/usePageState'
import { getSpeciesDetail } from '@/services/collection-service'
import type { SpeciesDetailView } from '@/types/views'
import { toUserMessage } from '@/utils/business-error'
import { formatDateTime } from '@/utils/date'
import { enterPrivatePage } from '@/utils/navigation'

const detail = ref<SpeciesDetailView | null>(null)
const {
  isLoading,
  isError,
  isSuccess,
  errorMessage,
  prepareLoad,
  isCurrentLoad,
  setSuccess,
  setError
} = usePageState()

onLoad((query: Record<string, string | undefined> | undefined): void => {
  if (!enterPrivatePage()) {
    return
  }
  const id = query?.id
  if (!id) {
    setError('缺少物种 ID')
    return
  }
  void loadDetail(id)
})

async function loadDetail(speciesId: string): Promise<void> {
  const ticket = prepareLoad()
  try {
    const nextDetail = await getSpeciesDetail(speciesId)
    if (!isCurrentLoad(ticket)) {
      return
    }
    detail.value = nextDetail
    setSuccess(ticket)
  } catch (error) {
    setError(toUserMessage(error, '物种档案加载失败'), ticket)
  }
}

function handleRetry(): void {
  if (detail.value) {
    void loadDetail(detail.value.speciesId)
  }
}

</script>

<template>
  <view class="page">
    <LoadingState v-if="isLoading" />
    <ErrorState v-else-if="isError" :message="errorMessage" @action="handleRetry" />
    <view v-else-if="isSuccess && detail">
      <PlantSpecimenSheet
        :item-id="detail.speciesId"
        :title="detail.chineseName"
        :latin-name="detail.scientificName"
        :image-url="detail.coverImageUrl"
        :family="`${detail.family} · ${detail.genus}`"
        :captured-at="detail.firstDiscoveredAt ?? ''"
        :count="detail.userInstanceCount"
      />
      <text v-if="detail.commonNames.length" class="alias">别名 {{ detail.commonNames.join('、') }}</text>
      <view class="stats">
        <view class="fv-inline-stat stats-row">
          <text class="fv-inline-stat__label stats-label">已收藏</text>
          <text class="fv-inline-stat__num stats-num">{{ detail.userInstanceCount }}</text>
          <text class="fv-inline-stat__label stats-label">株</text>
        </view>
        <view v-if="detail.firstDiscoveredAt" class="fv-inline-stat stats-row">
          <text class="fv-inline-stat__label stats-label">首次发现</text>
          <text class="fv-inline-stat__num stats-num">{{ formatDateTime(detail.firstDiscoveredAt) }}</text>
        </view>
      </view>
      <text class="section">简介</text>
      <text class="body">{{ detail.description }}</text>
      <text class="section">形态特征</text>
      <text class="body">叶形：{{ detail.characteristics.leafShape }}</text>
      <text class="body">高度：{{ detail.characteristics.typicalHeight }}</text>
      <text
        v-for="feature in detail.characteristics.notableFeatures"
        :key="feature"
        class="body"
      >
        · {{ feature }}
      </text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  padding: 24rpx 32rpx 48rpx;
  background-color: #0f1914;
}

.alias,
.body {
  display: block;
  margin-top: 8rpx;
  color: #8ea394;
  font-size: 26rpx;
  line-height: 1.7;
}

.stats {
  margin-top: 24rpx;
  background: rgba(14, 34, 26, 0.94);
  border: 1rpx solid rgba(232, 197, 106, 0.28);
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.stats-row {
  gap: 8rpx;
}

.stats-label,
.stats-num {
  font-size: 24rpx;
  line-height: 28rpx;
  height: 28rpx;
  color: #d4a359;
}

.section {
  display: block;
  margin: 36rpx 0 12rpx;
  font-size: 26rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
  color: #d4a359;
}

</style>
