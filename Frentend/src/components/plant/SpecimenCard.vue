<script setup lang="ts">
import { computed } from 'vue'
import { PlantRarity } from '@/enums/plant-rarity'
import { formatDateTimeWithSeconds } from '@/utils/date'

interface Props {
  itemId: string
  title: string
  latinName: string
  imageUrl: string
  family?: string
  capturedAt?: string
  count?: number
  isNew?: boolean
  compact?: boolean
  layout?: 'tile' | 'sheet'
  note?: string
  rarity?: PlantRarity
  tags?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  family: '',
  capturedAt: '',
  count: 0,
  isNew: false,
  compact: false,
  layout: 'tile',
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

const visibleTags = computed((): string[] => {
  const tags = props.family ? [props.family, ...props.tags] : props.tags
  return [...new Set(tags.filter((tag: string): boolean => tag.trim().length > 0))].slice(0, 2)
})

const rarityLabel = computed((): string => RARITY_LABELS[props.rarity])

function handleTap(): void {
  emit('tap', props.itemId)
}

function dateText(capturedAt: string): string {
  return capturedAt ? formatDateTimeWithSeconds(capturedAt) : ''
}

function rarityClass(rarity: PlantRarity): string {
  return `rarity-${rarity.toLowerCase()}`
}
</script>

<template>
  <view class="journal" :class="[layout, { compact }]" @tap.stop="handleTap">
    <view class="liner" />
    <view class="corner tl"><view class="corner-in" /></view>
    <view class="corner tr"><view class="corner-in" /></view>
    <view class="corner bl"><view class="corner-in" /></view>
    <view class="corner br"><view class="corner-in" /></view>
    <view class="page">
      <view class="band">
        <view class="crest">
          <view class="crest-leaf left" />
          <view class="crest-leaf right" />
        </view>
        <text class="title">{{ title }}</text>
      </view>
      <view class="ticket">
        <text class="ticket-en">{{ latinName }}</text>
      </view>
      <view class="plate">
        <image v-if="imageUrl" class="photo" :src="imageUrl" mode="aspectFit" />
        <view v-else class="sketch">
          <view class="stem" />
          <view class="frond a" />
          <view class="frond b" />
          <view class="frond c" />
          <view class="frond d" />
          <view class="frond e" />
          <view class="frond f" />
          <view class="curl" />
        </view>
        <view class="seal">
          <view class="seal-ring">
            <text class="seal-word">标本</text>
          </view>
        </view>
        <view v-if="isNew" class="wax">
          <text class="wax-word">新</text>
        </view>
        <view class="rarity" :class="rarityClass(rarity)">
          <view class="rarity-dot" />
          <text class="rarity-text">{{ rarityLabel }}</text>
        </view>
      </view>
      <view class="footer" :class="{ 'has-count': count > 0 }">
        <view v-if="visibleTags.length" class="tags">
          <text v-for="tag in visibleTags" :key="tag" class="tag">{{ tag }}</text>
        </view>
        <text v-if="note" class="caption">{{ note }}</text>
        <text v-else-if="dateText(capturedAt)" class="caption">{{ dateText(capturedAt) }}</text>
      </view>
      <view v-if="count > 0" class="count-seal">
        <text class="count-text">×{{ count }}</text>
      </view>
    </view>
    <view class="clasp">
      <view class="clasp-slit" />
      <view class="clasp-strap">
        <view class="clasp-stitch is-left">
          <view class="clasp-tick" />
          <view class="clasp-tick" />
          <view class="clasp-tick" />
          <view class="clasp-tick" />
        </view>
        <view class="clasp-stitch is-right">
          <view class="clasp-tick" />
          <view class="clasp-tick" />
          <view class="clasp-tick" />
          <view class="clasp-tick" />
        </view>
      </view>
      <view class="clasp-stud">
        <view class="clasp-dome">
          <view class="clasp-glint" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.journal {
  position: relative;
  box-sizing: border-box;
  background-color: #18271f;
  background-image:
    radial-gradient(circle at 18% 14%, rgba(255, 255, 255, 0.07), transparent 28%),
    repeating-linear-gradient(86deg, rgba(0, 0, 0, 0.1) 0 1px, rgba(255, 255, 255, 0.018) 1px 4px),
    linear-gradient(145deg, #263a2e 0%, #15241c 52%, #0d1812 100%);
  border: 2rpx solid #9b7a3d;
  border-radius: 18rpx;
  padding: 14rpx 28rpx 14rpx 14rpx;
  box-shadow:
    0 12rpx 26rpx rgba(0, 0, 0, 0.48),
    inset 0 0 0 3rpx rgba(17, 30, 23, 0.88),
    inset 0 1rpx 0 rgba(255, 255, 255, 0.16);
  overflow: visible;
}

.journal.tile {
  aspect-ratio: 3 / 4;
}

.liner {
  position: absolute;
  top: 6rpx;
  right: 6rpx;
  bottom: 6rpx;
  left: 6rpx;
  border: 2rpx solid rgba(218, 184, 108, 0.52);
  border-radius: 14rpx;
  pointer-events: none;
}

.corner {
  position: absolute;
  width: 26rpx;
  height: 26rpx;
  z-index: 4;
  pointer-events: none;
  border-color: #e6d09a;
  border-style: solid;
}

.corner-in {
  position: absolute;
  width: 12rpx;
  height: 12rpx;
  border-color: rgba(230, 208, 154, 0.75);
  border-style: solid;
}

.tl {
  top: 8rpx;
  left: 8rpx;
  border-width: 3rpx 0 0 3rpx;
}

.tl .corner-in {
  top: 6rpx;
  left: 6rpx;
  border-width: 2rpx 0 0 2rpx;
}

.tr {
  top: 8rpx;
  right: 8rpx;
  border-width: 3rpx 3rpx 0 0;
}

.tr .corner-in {
  top: 6rpx;
  right: 6rpx;
  border-width: 2rpx 2rpx 0 0;
}

.bl {
  bottom: 8rpx;
  left: 8rpx;
  border-width: 0 0 3rpx 3rpx;
}

.bl .corner-in {
  bottom: 6rpx;
  left: 6rpx;
  border-width: 0 0 2rpx 2rpx;
}

.br {
  right: 8rpx;
  bottom: 8rpx;
  border-width: 0 3rpx 3rpx 0;
}

.br .corner-in {
  right: 6rpx;
  bottom: 6rpx;
  border-width: 0 2rpx 2rpx 0;
}

.page {
  position: relative;
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6rpx 8rpx 8rpx;
}

.band {
  width: 100%;
  box-sizing: border-box;
  padding: 8rpx 10rpx 12rpx;
  background:
    radial-gradient(circle at 50% 0, rgba(229, 199, 127, 0.12), transparent 42%),
    linear-gradient(180deg, #26392d, #17281f);
  border: 3rpx solid #b38c49;
  border-radius: 12rpx 12rpx 6rpx 6rpx;
  box-shadow:
    inset 0 0 0 3rpx #17291f,
    inset 0 0 0 5rpx rgba(212, 180, 103, 0.54),
    0 4rpx 8rpx rgba(0, 0, 0, 0.32);
}

.crest {
  width: 30rpx;
  height: 12rpx;
  margin: 0 auto 2rpx;
  position: relative;
}

.crest-leaf {
  position: absolute;
  top: 2rpx;
  width: 15rpx;
  height: 8rpx;
  background: linear-gradient(180deg, #f8ebc4, #c9a25c);
  border-radius: 12rpx 1rpx 12rpx 1rpx;
  box-shadow: 0 1rpx 0 rgba(70, 46, 12, 0.28);
}

.crest-leaf.left {
  left: 0;
  transform: rotate(-28deg);
  transform-origin: right center;
}

.crest-leaf.right {
  right: 0;
  transform: rotate(28deg);
  transform-origin: left center;
}

.title {
  display: block;
  width: 100%;
  text-align: center;
  color: #f4e4c0;
  font-size: 38rpx;
  font-weight: 700;
  letter-spacing: 5rpx;
  line-height: 1.22;
  font-family: 'Songti SC', 'STSong', 'SimSun', serif;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket {
  width: 92%;
  z-index: 3;
  box-sizing: border-box;
  margin-top: -2rpx;
  padding: 5rpx 10rpx 6rpx;
  background: #efe0bd;
  border: 2rpx solid #b58d50;
  border-radius: 3rpx;
  box-shadow:
    0 3rpx 7rpx rgba(62, 37, 14, 0.3),
    inset 0 0 0 2rpx rgba(255, 249, 226, 0.5);
}

.ticket-en {
  display: block;
  width: 100%;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-en {
  color: #8a7352;
  font-size: 17rpx;
  font-style: italic;
  letter-spacing: 1px;
  font-family: Georgia, 'Times New Roman', serif;
}

.plate {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 220rpx;
  margin-top: -3rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-color: #ead8b3;
  background-image:
    radial-gradient(rgba(91, 61, 29, 0.12) 0.7px, transparent 0.8px),
    linear-gradient(180deg, #f4e6c6, #dfc99d);
  background-size: 8rpx 8rpx, 100% 100%;
  border: 2rpx solid #b58d50;
  border-radius: 3rpx 3rpx 10rpx 10rpx;
  box-shadow:
    inset 0 0 18rpx rgba(83, 51, 20, 0.2),
    0 4rpx 8rpx rgba(0, 0, 0, 0.22);
}

.compact .plate {
  min-height: 230rpx;
}

.photo {
  width: 100%;
  height: 100%;
  opacity: 0.98;
  mix-blend-mode: multiply;
}

.sketch {
  position: relative;
  width: 108rpx;
  height: 120rpx;
}

.stem {
  position: absolute;
  left: 50%;
  top: 4rpx;
  width: 2rpx;
  height: 96rpx;
  margin-left: -1rpx;
  background: #6e8468;
  border-radius: 2rpx;
}

.frond {
  position: absolute;
  width: 42rpx;
  height: 16rpx;
  background: #7f9874;
  border-radius: 16rpx 2rpx 16rpx 2rpx;
}

.frond.a {
  top: 22rpx;
  left: 18rpx;
  transform: rotate(-36deg);
}

.frond.b {
  top: 22rpx;
  right: 18rpx;
  transform: rotate(36deg);
}

.frond.c {
  top: 58rpx;
  left: 10rpx;
  width: 50rpx;
  transform: rotate(-24deg);
}

.frond.d {
  top: 58rpx;
  right: 10rpx;
  width: 50rpx;
  transform: rotate(24deg);
}

.frond.e {
  top: 96rpx;
  left: 16rpx;
  transform: rotate(-18deg);
}

.frond.f {
  top: 96rpx;
  right: 16rpx;
  transform: rotate(18deg);
}

.curl {
  position: absolute;
  left: 50%;
  bottom: 8rpx;
  width: 22rpx;
  height: 14rpx;
  margin-left: -18rpx;
  border: 2rpx solid #6e8468;
  border-top: 0;
  border-radius: 0 0 16rpx 16rpx;
}

.seal {
  position: absolute;
  left: 8rpx;
  bottom: 12rpx;
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(61, 107, 82, 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(-8deg);
  background: rgba(235, 218, 180, 0.54);
  pointer-events: none;
}

.seal-ring {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  border: 1px dashed rgba(61, 107, 82, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.seal-word {
  color: #3d6b52;
  font-size: 16rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.wax {
  position: absolute;
  top: 12rpx;
  right: 10rpx;
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: radial-gradient(circle at 36% 32%, #d15a42 0%, #9e3621 74%);
  border: 2px dashed rgba(244, 239, 230, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4rpx 8rpx rgba(80, 20, 10, 0.28),
    inset 0 2rpx 3rpx rgba(255, 255, 255, 0.28);
  transform: rotate(12deg);
  pointer-events: none;
}

.wax-word {
  color: #f8efe4;
  font-size: 20rpx;
  font-weight: 700;
}

.rarity {
  position: absolute;
  right: 4rpx;
  bottom: 4rpx;
  display: flex;
  align-items: center;
  padding: 4rpx 10rpx 4rpx 7rpx;
  border: 1rpx solid rgba(83, 61, 32, 0.45);
  border-radius: 2rpx;
  background: rgba(245, 232, 204, 0.88);
  box-shadow: 0 2rpx 5rpx rgba(71, 46, 20, 0.16);
  transform: rotate(-1deg);
}

.rarity-dot {
  width: 8rpx;
  height: 8rpx;
  margin-right: 6rpx;
  border-radius: 50%;
  background: #6f8054;
}

.rarity-text {
  color: #56462f;
  font-size: 15rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
}

.rarity-uncommon .rarity-dot {
  background: #4a7a5d;
}

.rarity-rare .rarity-dot {
  background: #b17635;
  box-shadow: 0 0 5rpx rgba(177, 118, 53, 0.45);
}

.rarity-legendary .rarity-dot {
  background: #a54832;
  box-shadow: 0 0 6rpx rgba(165, 72, 50, 0.55);
}

.caption {
  display: block;
  max-width: 58%;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.footer {
  width: 100%;
  min-height: 30rpx;
  padding-top: 6rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
}

.footer.has-count {
  padding-right: 48rpx;
}

.tags {
  max-width: 40%;
  display: flex;
  justify-content: flex-start;
  gap: 6rpx;
  overflow: hidden;
}

.tag {
  max-width: 100%;
  padding: 2rpx 8rpx;
  color: #d9c28f;
  font-size: 14rpx;
  line-height: 1.4;
  letter-spacing: 1rpx;
  border: 1rpx solid rgba(210, 176, 99, 0.42);
  border-radius: 2rpx;
  background: rgba(10, 24, 17, 0.5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.caption {
  color: #bda980;
  font-size: 12rpx;
  letter-spacing: 0;
}

.count-seal {
  position: absolute;
  right: 10rpx;
  bottom: 12rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(138, 90, 34, 0.7);
  background: radial-gradient(circle at 35% 30%, #fff1c4, #e0b45a 48%, #8a5a22 84%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 4rpx rgba(60, 30, 0, 0.25);
}

.count-text {
  color: #3a2814;
  font-size: 16rpx;
  line-height: 16rpx;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', sans-serif;
  font-variant-numeric: tabular-nums;
}

.clasp {
  position: absolute;
  top: 50%;
  right: -14rpx;
  z-index: 6;
  width: 38rpx;
  height: 124rpx;
  margin-top: -62rpx;
  pointer-events: none;
}

.clasp-slit {
  position: absolute;
  top: 16rpx;
  bottom: 16rpx;
  left: -4rpx;
  width: 8rpx;
  border-radius: 3rpx;
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.02));
}

.clasp-strap {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  border-radius: 8rpx 14rpx 14rpx 8rpx;
  background: linear-gradient(90deg, #f2c892 0%, #c4844e 12%, #8a4e30 42%, #a86a42 70%, #5a301c 100%);
  box-shadow:
    inset 2rpx 0 0 rgba(255, 236, 208, 0.72),
    inset -3rpx 0 4rpx rgba(42, 16, 8, 0.5),
    inset 0 2rpx 2rpx rgba(255, 244, 220, 0.4),
    inset 0 -3rpx 3rpx rgba(42, 16, 8, 0.4),
    2rpx 4rpx 7rpx rgba(0, 0, 0, 0.4);
}

.clasp-stitch {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 3rpx;
}

.clasp-stitch.is-left {
  left: 5rpx;
}

.clasp-stitch.is-right {
  right: 6rpx;
}

.clasp-tick {
  position: absolute;
  left: 0;
  width: 3rpx;
  height: 6rpx;
  border-radius: 2rpx;
  background: linear-gradient(90deg, #f6e4bc, #c9a56a);
  box-shadow: 1rpx 1rpx 0 rgba(48, 22, 8, 0.4);
}

.clasp-tick:nth-child(1) {
  top: 14rpx;
}

.clasp-tick:nth-child(2) {
  top: 30rpx;
}

.clasp-tick:nth-child(3) {
  bottom: 30rpx;
}

.clasp-tick:nth-child(4) {
  bottom: 14rpx;
}

.clasp-stud {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 30rpx;
  height: 30rpx;
  margin-left: -15rpx;
  margin-top: -15rpx;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 64%, #7a4c1c, #2a160c 76%);
  box-shadow:
    0 3rpx 5rpx rgba(0, 0, 0, 0.45),
    0 1rpx 0 rgba(255, 236, 200, 0.35);
}

.clasp-dome {
  position: absolute;
  top: 3rpx;
  right: 3rpx;
  bottom: 3rpx;
  left: 3rpx;
  border-radius: 50%;
  background: radial-gradient(
    circle at 32% 28%,
    #fff8dc 0%,
    #f6dc96 16%,
    #e2b85e 46%,
    #b88638 74%,
    #7a4e1c 100%
  );
  box-shadow:
    inset 0 0 0 1rpx rgba(122, 78, 28, 0.45),
    inset 0 -3rpx 4rpx rgba(90, 48, 10, 0.45),
    inset 0 2rpx 2rpx rgba(255, 252, 236, 0.85);
}

.clasp-glint {
  position: absolute;
  top: 16%;
  left: 22%;
  width: 32%;
  height: 16%;
  border-radius: 50%;
  background: rgba(255, 252, 242, 0.95);
}

.sheet {
  aspect-ratio: 3 / 4;
  padding: 18rpx 36rpx 22rpx 18rpx;
  border-radius: 22rpx;
}

.sheet .page {
  padding: 18rpx 18rpx 22rpx;
}

.sheet .band {
  padding: 14rpx 16rpx 16rpx;
  border-radius: 12rpx;
}

.sheet .title {
  font-size: 64rpx;
  letter-spacing: 10rpx;
}

.sheet .ticket {
  margin-top: -4rpx;
  padding: 10rpx 16rpx 12rpx;
}

.sheet .ticket-en {
  font-size: 23rpx;
}

.sheet .sketch {
  transform: scale(2.05);
}

.sheet .plate {
  flex: 1;
  min-height: 420rpx;
  margin-top: -4rpx;
}

.sheet .photo {
  width: 100%;
}

.sheet .seal {
  width: 96rpx;
  height: 96rpx;
  left: 8rpx;
  bottom: 12rpx;
}

.sheet .seal-ring {
  width: 74rpx;
  height: 74rpx;
}

.sheet .seal-word {
  font-size: 22rpx;
}

.sheet .wax {
  width: 72rpx;
  height: 72rpx;
}

.sheet .wax-word {
  font-size: 26rpx;
}

.sheet .caption {
  font-size: 22rpx;
}

.sheet .rarity {
  right: 10rpx;
  bottom: 12rpx;
  padding: 7rpx 16rpx 7rpx 10rpx;
}

.sheet .rarity-dot {
  width: 12rpx;
  height: 12rpx;
  margin-right: 8rpx;
}

.sheet .rarity-text {
  font-size: 20rpx;
}

.sheet .tags {
  gap: 10rpx;
}

.sheet .tag {
  padding: 4rpx 14rpx;
  font-size: 19rpx;
}

.sheet .clasp {
  width: 48rpx;
  height: 156rpx;
  margin-top: -78rpx;
  right: -16rpx;
}

.sheet .clasp-stud {
  width: 38rpx;
  height: 38rpx;
  margin-left: -19rpx;
  margin-top: -19rpx;
}

.sheet .clasp-tick:nth-child(1) {
  top: 18rpx;
}

.sheet .clasp-tick:nth-child(2) {
  top: 38rpx;
}

.sheet .clasp-tick:nth-child(3) {
  bottom: 38rpx;
}

.sheet .clasp-tick:nth-child(4) {
  bottom: 18rpx;
}
</style>
