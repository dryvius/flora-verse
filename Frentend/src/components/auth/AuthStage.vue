<script setup lang="ts">
import { computed } from 'vue'
import { AuthMessageTone } from '@/enums/auth-message-tone'

const props = defineProps<{
  title: string
  description: string
  message: string
  tone: AuthMessageTone
}>()

const messageClass = computed((): string => {
  if (props.tone === AuthMessageTone.Notice) {
    return 'is-notice'
  }
  if (props.tone === AuthMessageTone.Error) {
    return 'is-error'
  }
  return ''
})

const hasMessage = computed((): boolean => props.message.length > 0)
</script>

<template>
  <view class="page">
    <view class="petal petal-left" />
    <view class="petal petal-right" />
    <view class="content">
      <view class="mark">
        <view class="sprout">
          <view class="blade" />
          <view class="seed" />
        </view>
      </view>
      <text class="wordmark">FloraVerse</text>
      <text class="kicker">一片叶子，一座世界</text>

      <view class="card">
        <text class="heading">{{ title }}</text>
        <text class="lead">{{ description }}</text>
        <slot name="fields" />
        <view class="form-message">
          <text v-if="hasMessage" :class="messageClass">{{ message }}</text>
        </view>
        <slot name="actions" />
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.page {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 0%, rgba(74, 122, 93, 0.48), transparent 34%),
    radial-gradient(circle at 100% 12%, rgba(212, 163, 89, 0.2), transparent 26%),
    #0f1914;
}

.petal {
  position: absolute;
  width: 220rpx;
  height: 220rpx;
  border-radius: 80% 0 80% 0;
  pointer-events: none;
}

.petal-left {
  top: 36rpx;
  left: -92rpx;
  background: rgba(74, 122, 93, 0.2);
  transform: rotate(-24deg);
}

.petal-right {
  top: 260rpx;
  right: -120rpx;
  background: rgba(212, 163, 89, 0.12);
  transform: rotate(28deg);
}

.content {
  position: relative;
  z-index: 1;
  padding: 28rpx 40rpx calc(48rpx + env(safe-area-inset-bottom));
}

.mark {
  width: 128rpx;
  height: 128rpx;
  margin: 8rpx auto 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 32% 28%, rgba(244, 239, 230, 0.22), transparent 42%),
    linear-gradient(160deg, #1d3428, #102219);
  border: 2rpx solid rgba(212, 163, 89, 0.55);
  box-shadow:
    0 12rpx 32rpx rgba(0, 0, 0, 0.28),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.08);
}

.sprout {
  position: relative;
  width: 64rpx;
  height: 72rpx;
}

.blade {
  position: absolute;
  left: 14rpx;
  top: 0;
  width: 36rpx;
  height: 54rpx;
  background: linear-gradient(160deg, #e7f6d8 0%, #7ea86a 46%, #2f6a45 100%);
  border-radius: 80% 0 80% 0;
  transform: rotate(-32deg);
}

.seed {
  position: absolute;
  left: 24rpx;
  bottom: 4rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #d4a359;
}

.wordmark {
  display: block;
  margin-top: 20rpx;
  text-align: center;
  color: #f4efe6;
  font-size: 48rpx;
  font-weight: 700;
  line-height: 60rpx;
  letter-spacing: 2rpx;
}

.kicker {
  display: block;
  margin-top: 6rpx;
  text-align: center;
  color: #d4a359;
  font-size: 22rpx;
  line-height: 32rpx;
  letter-spacing: 6rpx;
}

.card {
  margin-top: 36rpx;
  padding: 40rpx 32rpx 32rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.42), transparent 26%),
    #f4efe6;
  border-radius: 32rpx 16rpx 28rpx 16rpx;
  box-shadow: 0 18rpx 48rpx rgba(0, 0, 0, 0.28);
}

.heading {
  display: block;
  color: #2b2823;
  font-size: 44rpx;
  font-weight: 700;
  line-height: 56rpx;
}

.lead {
  display: block;
  margin-top: 12rpx;
  margin-bottom: 32rpx;
  color: #6d675e;
  font-size: 26rpx;
  line-height: 40rpx;
}

.form-message {
  min-height: 72rpx;
  margin: 4rpx 0 20rpx;
}

.form-message text {
  font-size: 24rpx;
  line-height: 36rpx;
}

.is-error {
  color: #b85d43;
}

.is-notice {
  color: #3f6b4e;
}
</style>
