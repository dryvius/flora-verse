<script setup lang="ts">
interface Props {
  title?: string
  message: string
  actionText?: string
}

withDefaults(defineProps<Props>(), {
  title: '探索中断',
  actionText: '再次尝试'
})

const emit = defineEmits<{
  action: []
}>()

function handleAction(): void {
  emit('action')
}
</script>

<template>
  <view class="state">
    <text class="title">{{ title }}</text>
    <text class="desc">{{ message }}</text>
    <text class="action" @tap="handleAction">{{ actionText }}</text>
  </view>
</template>

<style lang="scss" scoped>
.state {
  padding: 80rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.title {
  font-size: 32rpx;
  font-weight: 700;
  color: #f4efe2;
}

.desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #8ea394;
  line-height: 1.6;
}

.action {
  margin-top: 28rpx;
  color: #d4a359;
  font-size: 28rpx;
  font-weight: 700;
}
</style>
