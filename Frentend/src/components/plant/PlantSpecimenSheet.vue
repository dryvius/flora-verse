<script setup lang="ts">
import { computed } from 'vue'
import { PlantRarity } from '@/enums/plant-rarity'

interface Props {
  itemId: string
  title: string
  latinName: string
  imageUrl: string
  family?: string
  capturedAt?: string
  count?: number
  isNew?: boolean
  note?: string
  rarity?: PlantRarity
  tags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  family: '',
  capturedAt: '',
  count: 0,
  isNew: false,
  note: '',
  rarity: PlantRarity.Common,
  tags: () => []
})

const emit = defineEmits<{
  tap: [itemId: string]
}>()

const RARITY_LABELS: Record<PlantRarity, string> = {
  [PlantRarity.Common]: '常见',
  [PlantRarity.Uncommon]: '少见',
  [PlantRarity.Rare]: '珍稀',
  [PlantRarity.Legendary]: '传奇'
}

const rarityLabel = computed((): string => RARITY_LABELS[props.rarity])

const visibleTags = computed((): string[] => {
  const values = props.family ? [props.family, ...props.tags] : props.tags
  return [...new Set(values.filter((tag: string): boolean => tag.trim().length > 0))].slice(0, 3)
})

const specimenCode = computed((): string => {
  const normalized = props.itemId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
  return normalized.slice(-8).padStart(8, '0')
})

const capturedDate = computed((): string => props.capturedAt.slice(0, 10))

function handleTap(): void {
  emit('tap', props.itemId)
}
</script>

<template>
  <view class="sheet" @tap.stop="handleTap">
    <view class="paper-grain" />
    <view class="tape tape-left" />
    <view class="tape tape-right" />

    <view class="sheet-header">
      <view class="identity">
        <text class="eyebrow">HERBARIUM SPECIMEN</text>
        <text class="title">{{ title }}</text>
        <text class="latin">{{ latinName }}</text>
      </view>
      <view class="catalog">
        <text class="catalog-label">档案编号</text>
        <text class="catalog-code">{{ specimenCode }}</text>
      </view>
    </view>

    <view class="divider">
      <view class="divider-line" />
      <view class="divider-mark" />
      <view class="divider-line" />
    </view>

    <view class="specimen-stage">
      <image v-if="imageUrl" class="specimen-image" :src="imageUrl" mode="aspectFit" />
      <view v-else class="empty-illustration">
        <text class="empty-mark">✦</text>
        <text class="empty-text">等待标本影像</text>
      </view>
      <view v-if="isNew" class="new-stamp">
        <text class="new-stamp-text">初见</text>
      </view>
      <view class="rarity-stamp">
        <text class="rarity-label">稀有度</text>
        <text class="rarity-value">{{ rarityLabel }}</text>
      </view>
    </view>

    <view class="annotation">
      <view class="annotation-main">
        <view v-if="visibleTags.length" class="tags">
          <text v-for="tag in visibleTags" :key="tag" class="tag">{{ tag }}</text>
        </view>
        <text v-if="note" class="note">{{ note }}</text>
      </view>
      <view class="annotation-meta">
        <text v-if="capturedDate" class="meta-label">采集日期</text>
        <text v-if="capturedDate" class="meta-value">{{ capturedDate }}</text>
        <view v-if="count > 0" class="meta-metric fv-inline-stat">
          <text class="fv-inline-stat__label meta-label-inline">馆藏</text>
          <text class="fv-inline-stat__num meta-num">×{{ count }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.sheet {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  padding: 42rpx 38rpx 34rpx;
  overflow: hidden;
  background-color: #eadbbb;
  background-image:
    linear-gradient(90deg, rgba(108, 76, 38, 0.035) 1rpx, transparent 1rpx),
    linear-gradient(rgba(108, 76, 38, 0.035) 1rpx, transparent 1rpx),
    linear-gradient(155deg, rgba(255, 251, 235, 0.72), rgba(220, 195, 148, 0.44));
  background-size: 24rpx 24rpx, 24rpx 24rpx, 100% 100%;
  border: 2rpx solid #9a7848;
  border-radius: 8rpx;
  box-shadow:
    0 12rpx 32rpx rgba(0, 0, 0, 0.35),
    inset 0 0 28rpx rgba(98, 65, 28, 0.14);
}

.paper-grain {
  position: absolute;
  inset: 10rpx;
  border: 1rpx solid rgba(91, 62, 31, 0.28);
  pointer-events: none;
}

.tape {
  position: absolute;
  top: 8rpx;
  width: 88rpx;
  height: 28rpx;
  z-index: 2;
  background: rgba(202, 177, 126, 0.62);
  box-shadow: 0 2rpx 4rpx rgba(77, 51, 26, 0.12);
}

.tape-left {
  left: -18rpx;
  transform: rotate(-18deg);
}

.tape-right {
  right: -18rpx;
  transform: rotate(18deg);
}

.sheet-header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24rpx;
}

.identity {
  flex: 1;
  min-width: 0;
}

.eyebrow,
.title,
.latin,
.catalog-label,
.catalog-code,
.meta-label,
.meta-value,
.note {
  display: block;
}

.eyebrow {
  color: #7b674b;
  font-size: 18rpx;
  letter-spacing: 4rpx;
  font-family: Georgia, 'Times New Roman', serif;
}

.title {
  margin-top: 8rpx;
  color: #342d23;
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 4rpx;
  font-family: 'Songti SC', 'STSong', 'SimSun', serif;
}

.latin {
  margin-top: 6rpx;
  color: #6b5d48;
  font-size: 24rpx;
  font-style: italic;
  font-family: Georgia, 'Times New Roman', serif;
}

.catalog {
  flex-shrink: 0;
  padding: 10rpx 12rpx;
  text-align: right;
  border: 1rpx solid rgba(91, 64, 35, 0.35);
  background: rgba(250, 243, 222, 0.42);
}

.catalog-label {
  color: #8a765a;
  font-size: 16rpx;
  letter-spacing: 2rpx;
}

.catalog-code {
  margin-top: 4rpx;
  color: #42372a;
  font-size: 18rpx;
  font-weight: 700;
  font-family: Georgia, 'Times New Roman', serif;
}

.divider {
  margin: 22rpx 0 18rpx;
  display: flex;
  align-items: center;
}

.divider-line {
  flex: 1;
  height: 1rpx;
  background: rgba(87, 59, 30, 0.38);
}

.divider-mark {
  width: 10rpx;
  height: 10rpx;
  margin: 0 12rpx;
  background: #8d6b38;
  transform: rotate(45deg);
}

.specimen-stage {
  position: relative;
  height: 620rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: rgba(247, 238, 211, 0.5);
  border: 1rpx solid rgba(95, 68, 38, 0.34);
  box-shadow: inset 0 0 24rpx rgba(85, 56, 24, 0.12);
}

.specimen-image {
  width: 100%;
  height: 100%;
  opacity: 0.98;
  mix-blend-mode: multiply;
}

.empty-illustration {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-mark {
  color: #8a765a;
  font-size: 70rpx;
}

.empty-text {
  margin-top: 12rpx;
  color: #8a765a;
  font-size: 22rpx;
  letter-spacing: 3rpx;
}

.new-stamp {
  position: absolute;
  top: 22rpx;
  right: 22rpx;
  width: 84rpx;
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx double rgba(145, 54, 35, 0.86);
  border-radius: 50%;
  transform: rotate(10deg);
}

.new-stamp-text {
  color: #9a3f2c;
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.rarity-stamp {
  position: absolute;
  left: 20rpx;
  bottom: 20rpx;
  padding: 10rpx 14rpx;
  border: 2rpx solid rgba(55, 100, 74, 0.62);
  transform: rotate(-4deg);
  background: rgba(235, 222, 188, 0.74);
}

.rarity-label,
.rarity-value {
  display: block;
  color: #37644a;
  text-align: center;
}

.rarity-label {
  font-size: 14rpx;
  letter-spacing: 2rpx;
}

.rarity-value {
  margin-top: 2rpx;
  font-size: 20rpx;
  font-weight: 700;
}

.annotation {
  margin-top: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20rpx;
}

.annotation-main {
  flex: 1;
  min-width: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
}

.tag {
  padding: 5rpx 12rpx;
  color: #554733;
  font-size: 18rpx;
  border: 1rpx solid rgba(99, 73, 42, 0.4);
  background: rgba(249, 240, 214, 0.5);
}

.note {
  margin-top: 10rpx;
  color: #6f604a;
  font-size: 21rpx;
  line-height: 1.5;
}

.annotation-meta {
  flex-shrink: 0;
  text-align: right;
}

.meta-label {
  color: #8a765a;
  font-size: 16rpx;
  letter-spacing: 2rpx;
}

.meta-value {
  margin-top: 4rpx;
  color: #4e4131;
  font-size: 19rpx;
  line-height: 24rpx;
  font-family: Georgia, 'Times New Roman', serif;
}

.meta-metric {
  margin-top: 4rpx;
  justify-content: flex-end;
  gap: 4rpx;
}

.meta-label-inline,
.meta-num {
  font-size: 19rpx;
  line-height: 24rpx;
  height: 24rpx;
  color: #4e4131;
}

.meta-num {
  font-weight: 700;
}
</style>
