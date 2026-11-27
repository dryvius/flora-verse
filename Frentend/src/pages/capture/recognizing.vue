<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { ref } from 'vue'
import AppButton from '@/components/common/AppButton.vue'
import CaptureJourney from '@/components/capture/CaptureJourney.vue'
import { startRecognition, waitForRecognition } from '@/services/capture-service'
import { validateAndUploadImage } from '@/services/image-service'
import { useCaptureSessionStore } from '@/stores/capture-session-store'
import { toUserMessage } from '@/utils/business-error'
import { enterPrivatePage, openCaptureResult, switchToCapture } from '@/utils/navigation'

const session = useCaptureSessionStore()
const failed = ref(false)
const errorMessage = ref('')
const running = ref(false)

onLoad((): void => {
  if (!enterPrivatePage()) {
    return
  }
  void runRecognition()
})

async function runRecognition(): Promise<void> {
  if (!session.localFilePath) {
    switchToCapture()
    return
  }
  failed.value = false
  running.value = true
  try {
    const image = await validateAndUploadImage(session.localFilePath)
    session.setImageKey(image.imageKey)
    const task = await startRecognition(image.imageKey)
    const finished = await waitForRecognition(task.id)
    session.setTask(finished)
    openCaptureResult()
  } catch (error) {
    failed.value = true
    errorMessage.value = toUserMessage(error, '识别失败，请重试')
  } finally {
    running.value = false
  }
}

function handleRetry(): void {
  void runRecognition()
}

function handleBack(): void {
  switchToCapture()
}
</script>

<template>
  <view class="page">
    <view class="journey-wrap">
      <CaptureJourney :current-step="3" />
    </view>
    <view v-if="!failed" class="center">
      <view class="rings">
        <view class="ring a" />
        <view class="ring b" />
        <view class="core" />
      </view>
      <text class="title">解析植物基因纹样</text>
      <text class="desc">模拟识别进行中。结果只是建议，确认后才会收藏。</text>
    </view>
    <view v-else class="center">
      <text class="title">解析失败</text>
      <text class="desc">{{ errorMessage }}</text>
      <view class="actions">
        <AppButton text="再次解析" :disabled="running" @tap="handleRetry" />
        <view class="gap" />
        <AppButton text="重新选图" type="ghost" @tap="handleBack" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  position: relative;
  background:
    radial-gradient(circle at 50% 42%, rgba(232, 197, 106, 0.16), transparent 40%),
    #04110c;
  display: flex;
  align-items: center;
  justify-content: center;
}

.center {
  width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.journey-wrap {
  position: absolute;
  top: 56rpx;
  left: 32rpx;
  right: 32rpx;
}

.rings {
  position: relative;
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 48rpx;
}

.ring,
.core {
  position: absolute;
  border-radius: 50%;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.a {
  width: 240rpx;
  height: 240rpx;
  border: 3rpx dashed rgba(232, 197, 106, 0.55);
  animation: spin 8s linear infinite;
}

.b {
  width: 160rpx;
  height: 160rpx;
  border: 2rpx solid rgba(93, 255, 177, 0.7);
  animation: spin 5s linear infinite reverse;
}

.core {
  width: 56rpx;
  height: 56rpx;
  background: #e8c56a;
  box-shadow: 0 0 32rpx #e8c56a;
}

.title {
  color: #f4efe2;
  font-size: 36rpx;
  font-weight: 800;
}

.desc {
  margin-top: 16rpx;
  color: rgba(244, 239, 226, 0.7);
  font-size: 24rpx;
  line-height: 1.7;
}

.actions {
  width: 100%;
  margin-top: 48rpx;
}

.gap {
  height: 16rpx;
}

@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}
</style>
