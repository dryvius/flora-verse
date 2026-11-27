<script setup lang="ts">
interface Props {
  title: string
  description?: string
  actionText?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
  actionText: ''
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
    <view class="mark">✦</view>
    <text class="title">{{ title }}</text>
    <text v-if="description" class="desc">{{ description }}</text>
    <text v-if="actionText" class="action" @tap="handleAction">{{ actionText }}</text>
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

.mark {
  margin-bottom: 20rpx;
  font-size: 36rpx;
  color: #d4a359;
}

.title {
  font-size: 32rpx;
  font-weight: 700;
  color: #ece9df;
}

.desc {
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #9aa89f;
  line-height: 1.6;
}

.action {
  margin-top: 28rpx;
  color: #d4a359;
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}
</style>
