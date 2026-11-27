<script setup lang="ts">
import { storeToRefs } from 'pinia'
import PlantJournalCover from '@/components/plant/PlantJournalCover.vue'
import { DiscoveryType } from '@/enums/discovery-type'
import { useSpecimenFanStore } from '@/stores/specimen-fan-store'
import type { InstanceCard } from '@/types/views'

const emit = defineEmits<{
  select: [card: InstanceCard]
}>()

const fanStore = useSpecimenFanStore()
const { isOpen, items, focusIndex } = storeToRefs(fanStore)
let touchStartX = 0

function readTouchX(event: TouchEvent): number {
  const list = event.changedTouches.length > 0 ? event.changedTouches : event.touches
  const point = list[0]
  return point?.clientX ?? point?.pageX ?? 0
}

function handleMask(): void {
  fanStore.close()
}

function handleCardTap(index: number): void {
  if (fanStore.isOpening()) {
    fanStore.setFocus(index)
    return
  }
  if (focusIndex.value === index) {
    const card = items.value[index]
    if (card) {
      fanStore.close()
      emit('select', card)
    }
    return
  }
  fanStore.setFocus(index)
}

function handleTouchStart(event: TouchEvent): void {
  touchStartX = readTouchX(event)
}

function handleTouchEnd(event: TouchEvent): void {
  if (items.value.length < 2) {
    return
  }
  const delta = readTouchX(event) - touchStartX
  if (delta > 48) {
    fanStore.setFocus(focusIndex.value - 1)
    return
  }
  if (delta < -48) {
    fanStore.setFocus(focusIndex.value + 1)
  }
}

function cardClass(index: number): string {
  if (index === focusIndex.value) {
    return 'fan-center'
  }
  return index < focusIndex.value ? 'fan-left' : 'fan-right'
}
</script>

<template>
  <!-- #ifdef MP-WEIXIN -->
  <root-portal>
  <!-- #endif -->
  <view v-if="isOpen" class="overlay" @touchmove.stop.prevent>
    <view class="veil" @tap="handleMask" />
    <view class="bloom" />
    <view class="stage" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
      <view
        v-for="(card, index) in items"
        :key="card.instanceId"
        class="leaf"
        :class="cardClass(index)"
        :style="{ zIndex: index === focusIndex ? 6 : 4 }"
      >
        <PlantJournalCover
          :item-id="card.instanceId"
          :title="card.chineseName"
          :latin-name="card.scientificName"
          :image-url="card.coverImageUrl"
          :family="card.family"
          :captured-at="card.capturedAt"
          :is-new="card.discoveryType === DiscoveryType.First"
          @tap="handleCardTap(index)"
        />
      </view>
    </view>
    <text class="hint">点空白处收回</text>
  </view>
  <!-- #ifdef MP-WEIXIN -->
  </root-portal>
  <!-- #endif -->
</template>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 10000;
}

.veil {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(8, 14, 11, 0.84);
}

.bloom {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 920rpx;
  height: 920rpx;
  margin-left: -460rpx;
  margin-top: -460rpx;
  border-radius: 50%;
  pointer-events: none;
  background: radial-gradient(
    circle,
    rgba(232, 196, 138, 0.52) 0%,
    rgba(212, 163, 89, 0.22) 38%,
    rgba(15, 25, 20, 0) 74%
  );
  animation: bloomIn 0.45s cubic-bezier(0.25, 1, 0.5, 1);
}

.stage {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 520rpx;
  height: 680rpx;
  margin-left: -260rpx;
  margin-top: -360rpx;
}

.leaf {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  transform-origin: 50% 120%;
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1);
}

.fan-left {
  transform: rotate(-14deg) translateY(-20rpx);
  opacity: 0.72;
}

.fan-center {
  transform: rotate(0deg) translateY(-40rpx) scale(1.05);
  opacity: 1;
}

.fan-right {
  transform: rotate(14deg) translateY(-20rpx);
  opacity: 0.72;
}

.hint {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 220rpx;
  text-align: center;
  font-size: 22rpx;
  letter-spacing: 4rpx;
  color: rgba(212, 163, 89, 0.72);
  pointer-events: none;
}

@keyframes bloomIn {
  from {
    opacity: 0;
    transform: scale(0.72);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
