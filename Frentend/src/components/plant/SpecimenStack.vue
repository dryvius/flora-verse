<script setup lang="ts">
import { computed } from 'vue'
import PlantJournalCover from '@/components/plant/PlantJournalCover.vue'
import { DiscoveryType } from '@/enums/discovery-type'
import { useSpecimenFanStore } from '@/stores/specimen-fan-store'
import type { InstanceCard } from '@/types/views'

interface Props {
  items: InstanceCard[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [card: InstanceCard]
}>()

const fanStore = useSpecimenFanStore()

const visibleItems = computed((): InstanceCard[] => props.items.slice(0, 3))

const canFan = computed((): boolean => visibleItems.value.length > 1)

function handleStackTap(): void {
  const first = visibleItems.value[0]
  if (!first) {
    return
  }
  if (!canFan.value) {
    emit('select', first)
    return
  }
  fanStore.open(visibleItems.value)
}

function cardZ(index: number): number {
  return visibleItems.value.length - index
}
</script>

<template>
  <view class="stack">
    <view
      v-for="(card, index) in visibleItems"
      :key="card.instanceId"
      class="leaf"
      :class="`rest-${index}`"
      :style="{ zIndex: cardZ(index) }"
    >
      <PlantJournalCover
        :item-id="card.instanceId"
        :title="card.chineseName"
        :latin-name="card.scientificName"
        :image-url="card.coverImageUrl"
        :family="card.family"
        :captured-at="card.capturedAt"
        :is-new="card.discoveryType === DiscoveryType.First"
        @tap="handleStackTap"
      />
    </view>
    <view v-if="visibleItems.length > 1" class="stack-badge" @tap.stop="handleStackTap">
      <text class="badge-text">×{{ visibleItems.length }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.stack {
  position: relative;
}

.leaf {
  width: 100%;
  transform-origin: 50% 120%;
}

.rest-0 {
  position: relative;
  z-index: 3;
  transform: rotate(0deg);
}

.rest-1,
.rest-2 {
  position: absolute;
  left: 0;
  top: 0;
}

.rest-1 {
  transform: rotate(-4deg) translateY(8rpx);
}

.rest-2 {
  transform: rotate(4deg) translateY(8rpx);
}

.stack-badge {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  z-index: 8;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff1c4, #e0b45a 46%, #8a5a22 82%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3rpx 6rpx rgba(0, 0, 0, 0.35);
}

.badge-text {
  color: #3a2814;
  font-size: 18rpx;
  line-height: 18rpx;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  font-variant-numeric: tabular-nums;
}
</style>
