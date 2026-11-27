<script setup lang="ts">
interface Props {
  text?: string
}

withDefaults(defineProps<Props>(), {
  text: '共鸣中…'
})
</script>

<template>
  <view class="state">
    <view class="ring" />
    <text class="text">{{ text }}</text>
  </view>
</template>

<style lang="scss" scoped>
.state {
  padding: 80rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
}

.ring {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(212, 163, 89, 0.2);
  border-top-color: #d4a359;
  animation: spin 0.8s linear infinite;
}

.text {
  color: #8ea394;
  font-size: 24rpx;
  letter-spacing: 4rpx;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
