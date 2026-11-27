<script setup lang="ts">
import { DiscoveryType } from '@/enums/discovery-type'
import type { InstanceCard } from '@/types/views'

defineProps<{
  items: InstanceCard[]
}>()

const emit = defineEmits<{
  openItem: [instanceId: string]
  openCodex: []
}>()

function handleOpen(instanceId: string): void {
  emit('openItem', instanceId)
}

function handleOpenCodex(): void {
  emit('openCodex')
}
</script>

<template>
  <view class="rail-block">
    <view class="head">
      <text class="title">近期收获</text>
      <text class="link" @tap="handleOpenCodex">图鉴 ›</text>
    </view>

    <scroll-view v-if="items.length > 0" scroll-x class="rail" :show-scrollbar="false" enable-flex>
      <view class="track">
        <view
          v-for="item in items"
          :key="item.instanceId"
          class="chip"
          @tap="handleOpen(item.instanceId)">
          <view class="thumb-wrap">
            <image class="thumb" :src="item.coverImageUrl" mode="aspectFill" />
            <view class="thumb-veil" />
            <text v-if="item.discoveryType === DiscoveryType.First" class="new-seal">新</text>
          </view>
          <text class="chip-name">{{ item.chineseName }}</text>
          <text class="chip-latin">{{ item.scientificName }}</text>
        </view>
      </view>
    </scroll-view>

    <view v-else class="empty" @tap="handleOpenCodex">
      <text class="empty-text">温室暂无更多收获，去图鉴翻阅或继续探索</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.rail-block {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 0 4rpx;
}

.title {
  font-size: 24rpx;
  letter-spacing: 6rpx;
  color: #d4a359;
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', Georgia, 'Times New Roman', serif;
}

.link {
  font-size: 20rpx;
  color: #8ba895;
  letter-spacing: 1rpx;
}

.rail {
  width: 100%;
}

.track {
  display: flex;
  flex-direction: row;
  gap: 16rpx;
  padding: 2rpx 4rpx 8rpx;
}

.chip {
  width: 200rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.thumb-wrap {
  position: relative;
  height: 200rpx;
  border-radius: 10rpx;
  overflow: hidden;
  border: 1rpx solid rgba(212, 163, 89, 0.28);
  background: #14241c;
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.04);
}

.thumb {
  width: 100%;
  height: 100%;
}

.thumb-veil {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 24rpx rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.new-seal {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16rpx;
  color: #f4efe6;
  background: radial-gradient(circle, #c24a32 58%, #9e3621 100%);
  transform: rotate(-12deg);
}

.chip-name {
  font-size: 24rpx;
  color: #ece9df;
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', Georgia, 'Times New Roman', serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-latin {
  font-size: 16rpx;
  color: #7f9186;
  font-style: italic;
  font-family: Georgia, 'Times New Roman', serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty {
  padding: 28rpx 20rpx;
  border: 1rpx dashed rgba(212, 163, 89, 0.22);
  border-radius: 12rpx;
  background: rgba(14, 28, 22, 0.4);
}

.empty-text {
  font-size: 22rpx;
  line-height: 32rpx;
  color: #7f9186;
}
</style>
