<script setup lang="ts">
defineProps<{
  prefix: string
  action: string
}>()

const emit = defineEmits<{
  tap: []
}>()

function handleTap(): void {
  emit('tap')
}
</script>

<template>
  <view class="switch" @tap="handleTap">
    <text class="prefix">{{ prefix }}</text>
    <text class="action">{{ action }}</text>
  </view>
</template>

<style lang="scss" scoped>
.switch {
  margin-top: 28rpx;
  min-height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prefix {
  color: #6d675e;
  font-size: 26rpx;
  line-height: 36rpx;
}

.action {
  margin-left: 8rpx;
  color: #3f6b4e;
  font-size: 26rpx;
  line-height: 36rpx;
  font-weight: 700;
}
</style>
