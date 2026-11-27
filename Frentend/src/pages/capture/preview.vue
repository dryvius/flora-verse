<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import CaptureJourney from '@/components/capture/CaptureJourney.vue'
import { useCaptureSessionStore } from '@/stores/capture-session-store'
import { enterPrivatePage, openRecognizing, switchToCapture } from '@/utils/navigation'

const session = useCaptureSessionStore()
const hasImage = computed((): boolean => Boolean(session.localFilePath))

onLoad((): void => {
  if (!enterPrivatePage()) {
    return
  }
  if (!session.localFilePath) {
    switchToCapture()
  }
})

function handleRetake(): void {
  uni.navigateBack()
}

function handleContinue(): void {
  openRecognizing()
}
</script>

<template>
  <view class="page">
    <image v-if="hasImage" class="preview" :src="session.localFilePath" mode="aspectFill" />
    <view v-else class="empty">未找到待识别照片</view>
    <view class="panel">
      <CaptureJourney :current-step="2" />
      <text class="kicker">TARGET LOCKED</text>
      <text class="title">确认这张照片？</text>
      <text class="desc">它只会作为识别建议的来源。确认物种前，不会创建收藏。</text>
      <AppButton text="开始解析" :disabled="!hasImage" @tap="handleContinue" />
      <view class="gap" />
      <AppButton text="重新锁定" type="ghost" @tap="handleRetake" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #07140f;
}

.preview {
  width: 100%;
  height: 58vh;
  background: #000;
}

.empty {
  height: 58vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8ea394;
}

.panel {
  flex: 1;
  padding: 32rpx;
  background: linear-gradient(180deg, #12281e, #07140f);
}

.kicker {
  display: block;
  margin-top: 24rpx;
  font-size: 20rpx;
  letter-spacing: 6rpx;
  color: #e8c56a;
}

.title {
  display: block;
  margin-top: 10rpx;
  font-size: 36rpx;
  font-weight: 800;
}

.desc {
  display: block;
  margin: 12rpx 0 32rpx;
  color: #8ea394;
  font-size: 24rpx;
  line-height: 1.6;
}

.gap {
  height: 16rpx;
}
</style>
