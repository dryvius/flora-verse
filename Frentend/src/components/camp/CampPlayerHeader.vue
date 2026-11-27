<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  displayName: string
  discoveredSpeciesCount: number
  catalogSpeciesTotal: number
  showCodex?: boolean
}>(), {
  showCodex: true
})

const emit = defineEmits<{
  openProfile: []
}>()

const avatarText = computed((): string => props.displayName.slice(0, 1) || '探')

function handleTap(): void {
  emit('openProfile')
}
</script>

<template>
  <view class="header" @tap="handleTap">
    <view class="avatar">{{ avatarText }}</view>
    <view class="meta">
      <text class="name">{{ displayName }}</text>
      <text v-if="showCodex" class="codex">标本 {{ discoveredSpeciesCount }} / {{ catalogSpeciesTotal }}</text>
    </view>
    <text class="chevron">›</text>
  </view>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 4rpx 2rpx;
}

.avatar {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 700;
  color: #2b2823;
  background: radial-gradient(circle at 30% 30%, #f4efe6, #d4a359);
  border: 2rpx solid rgba(212, 163, 89, 0.85);
  box-shadow: 0 0 0 3rpx rgba(13, 28, 20, 0.9);
  flex-shrink: 0;
}

.meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.name {
  font-size: 28rpx;
  line-height: 34rpx;
  color: #ece9df;
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', Georgia, 'Times New Roman', serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.codex {
  font-size: 20rpx;
  line-height: 24rpx;
  letter-spacing: 2rpx;
  color: #8ba895;
  font-variant-numeric: tabular-nums;
}

.chevron {
  color: rgba(212, 163, 89, 0.55);
  font-size: 30rpx;
  line-height: 1;
}
</style>
