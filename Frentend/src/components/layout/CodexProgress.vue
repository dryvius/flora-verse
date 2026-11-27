<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  unlockedCount: number
  catalogCount: number
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

const percent = computed((): number => {
  if (props.catalogCount <= 0) {
    return 0
  }
  const value = (props.unlockedCount / props.catalogCount) * 100
  if (value < 0) {
    return 0
  }
  if (value > 100) {
    return 100
  }
  return value
})
</script>

<template>
  <view class="progress" :class="{ 'is-compact': compact }">
    <view class="caption fv-inline-stat">
      <text class="fv-inline-stat__label caption-label">已解锁</text>
      <text class="fv-inline-stat__num caption-num">{{ unlockedCount }}</text>
      <text class="fv-inline-stat__sep">/</text>
      <text class="fv-inline-stat__num caption-num">{{ catalogCount }}</text>
      <text class="fv-inline-stat__label caption-label">种</text>
    </view>
    <view class="track">
      <view class="fill" :style="{ width: `${percent}%` }" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.progress {
  padding: 20rpx 8rpx 8rpx;
}

.progress.is-compact {
  padding: 0 8rpx;
}

.caption {
  letter-spacing: 1rpx;
}

.caption-label,
.caption-num {
  font-size: 22rpx;
  line-height: 26rpx;
  height: 26rpx;
  color: #9aa89f;
}

.caption-num {
  color: #d4a359;
}

.track {
  margin-top: 12rpx;
  height: 6rpx;
  border-radius: 6rpx;
  background: rgba(139, 168, 149, 0.18);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 6rpx;
  background: linear-gradient(90deg, #c4924a, #e8c48a);
}
</style>
