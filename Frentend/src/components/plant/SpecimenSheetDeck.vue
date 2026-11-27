<script setup lang="ts">
import { computed } from 'vue'
import PlantSpecimenSheet from '@/components/plant/PlantSpecimenSheet.vue'
import { DiscoveryType } from '@/enums/discovery-type'
import type { InstanceCard } from '@/types/views'

interface Props {
  items: InstanceCard[]
  activeId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  select: [card: InstanceCard]
}>()

let touchStartX = 0

const activeIndex = computed((): number => {
  const index = props.items.findIndex((item: InstanceCard): boolean => item.instanceId === props.activeId)
  return index >= 0 ? index : 0
})

function readTouchX(event: TouchEvent): number {
  const points = event.changedTouches.length > 0 ? event.changedTouches : event.touches
  const point = points[0]
  return point?.clientX ?? point?.pageX ?? 0
}

function cardClass(index: number): string {
  if (index === activeIndex.value) {
    return 'deck-active'
  }
  const nextIndex = (activeIndex.value + 1) % props.items.length
  const previousIndex = (activeIndex.value - 1 + props.items.length) % props.items.length
  if (index === nextIndex) {
    return 'deck-next'
  }
  if (index === previousIndex) {
    return 'deck-previous'
  }
  return 'deck-hidden'
}

function cardZIndex(index: number): number {
  if (index === activeIndex.value) {
    return 5
  }
  return cardClass(index) === 'deck-next' ? 4 : 3
}

function selectByOffset(offset: number): void {
  if (props.items.length < 2) {
    return
  }
  const nextIndex = (activeIndex.value + offset + props.items.length) % props.items.length
  const card = props.items[nextIndex]
  if (card) {
    emit('select', card)
  }
}

function handleTouchStart(event: TouchEvent): void {
  touchStartX = readTouchX(event)
}

function handleTouchEnd(event: TouchEvent): void {
  const deltaX = readTouchX(event) - touchStartX
  if (Math.abs(deltaX) < 42) {
    return
  }
  selectByOffset(deltaX < 0 ? 1 : -1)
}

function handleCardTap(card: InstanceCard): void {
  if (card.instanceId === props.activeId) {
    return
  }
  emit('select', card)
}
</script>

<template>
  <view
    class="deck"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <view
      v-for="(card, index) in items"
      :key="card.instanceId"
      class="deck-card"
      :class="cardClass(index)"
      :style="{ zIndex: cardZIndex(index) }"
    >
      <PlantSpecimenSheet
        :item-id="card.instanceId"
        :title="card.chineseName"
        :latin-name="card.scientificName"
        :image-url="card.coverImageUrl"
        :family="card.family"
        :captured-at="card.capturedAt"
        :is-new="card.discoveryType === DiscoveryType.First"
        @tap="handleCardTap(card)"
      />
    </view>

    <view v-if="items.length > 1" class="deck-controls">
      <text class="deck-arrow" @tap.stop="selectByOffset(-1)">‹</text>
      <view class="deck-dots">
        <view
          v-for="item in items"
          :key="item.instanceId"
          class="deck-dot"
          :class="{ active: item.instanceId === activeId }"
        />
      </view>
      <text class="deck-arrow" @tap.stop="selectByOffset(1)">›</text>
    </view>
    <text v-if="items.length > 1" class="deck-hint">左右拨动切换个体档案</text>
  </view>
</template>

<style lang="scss" scoped>
.deck {
  position: relative;
  height: 1040rpx;
  overflow: hidden;
}

.deck-card {
  position: absolute;
  top: 22rpx;
  left: 4%;
  width: 92%;
  transform-origin: 50% 110%;
  transition:
    transform 0.42s cubic-bezier(0.25, 1, 0.5, 1),
    opacity 0.3s ease;
}

.deck-active {
  opacity: 1;
  transform: translateX(0) rotate(0deg) scale(1);
}

.deck-next {
  opacity: 0.66;
  transform: translateX(54rpx) translateY(18rpx) rotate(3.2deg) scale(0.97);
}

.deck-previous {
  opacity: 0.54;
  transform: translateX(-54rpx) translateY(24rpx) rotate(-3.2deg) scale(0.96);
}

.deck-hidden {
  opacity: 0;
  pointer-events: none;
  transform: translateY(34rpx) scale(0.93);
}

.deck-controls {
  position: absolute;
  left: 50%;
  bottom: 36rpx;
  z-index: 8;
  min-width: 250rpx;
  padding: 6rpx 14rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1rpx solid rgba(212, 163, 89, 0.35);
  border-radius: 40rpx;
  background: rgba(8, 20, 14, 0.86);
  transform: translateX(-50%);
}

.deck-arrow {
  width: 48rpx;
  color: #dfb85f;
  text-align: center;
  font-size: 38rpx;
  line-height: 1;
}

.deck-dots {
  display: flex;
  gap: 10rpx;
}

.deck-dot {
  width: 9rpx;
  height: 9rpx;
  border-radius: 50%;
  background: #51675b;
  transition: width 0.25s ease, background-color 0.25s ease;
}

.deck-dot.active {
  width: 28rpx;
  border-radius: 8rpx;
  background: #d6a64c;
}

.deck-hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 8;
  color: #758b7f;
  text-align: center;
  font-size: 18rpx;
  letter-spacing: 3rpx;
}
</style>
