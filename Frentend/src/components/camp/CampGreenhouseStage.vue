<script setup lang="ts">
import { CampWeather } from '@/enums/camp-weather'
import type { CampFeaturedPlant } from '@/types/views'

defineProps<{
  plant: CampFeaturedPlant
  weather: CampWeather
}>()

const emit = defineEmits<{
  openPlant: [instanceId: string]
}>()

function handleTap(instanceId: string): void {
  emit('openPlant', instanceId)
}
</script>

<template>
  <view class="stage" :class="`weather-${weather}`" @tap="handleTap(plant.instanceId)">
    <view class="brass-outer">
      <view class="brass-inner">
        <view class="corner tl" />
        <view class="corner tr" />
        <view class="corner bl" />
        <view class="corner br" />

        <view class="viewport">
          <image class="hero" :src="plant.coverImageUrl" mode="aspectFill" />
          <view class="vignette" />
          <view class="weather-veil" />
          <view class="light-shaft" />

          <view class="hud-top">
            <text class="kicker">GREENHOUSE · FEATURED</text>
            <text class="status">{{ plant.statusLabel }}</text>
          </view>

          <view class="hud-bottom">
            <view class="identity">
              <text class="cn">{{ plant.chineseName }}</text>
              <text class="latin">{{ plant.scientificName }}</text>
              <text class="family">{{ plant.family }} · {{ plant.locationLabel }}</text>
            </view>
            <view class="power">
              <text class="power-label">战力</text>
              <text class="power-value">{{ plant.effectiveCombatPower }}</text>
              <text class="power-bonus">↑{{ plant.bonusPercent }}%</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.stage {
  width: 100%;
}

.brass-outer {
  padding: 3rpx;
  border-radius: 18rpx;
  background: linear-gradient(
    145deg,
    rgba(232, 196, 138, 0.72),
    rgba(122, 84, 36, 0.45) 42%,
    rgba(232, 196, 138, 0.55)
  );
  box-shadow: 0 18rpx 40rpx rgba(0, 0, 0, 0.35);
}

.brass-inner {
  position: relative;
  padding: 10rpx;
  border-radius: 16rpx;
  background: #0c1812;
  border: 1rpx solid rgba(212, 163, 89, 0.22);
}

.corner {
  position: absolute;
  width: 22rpx;
  height: 22rpx;
  border-color: rgba(232, 196, 138, 0.65);
  border-style: solid;
  z-index: 3;
  pointer-events: none;
}

.tl {
  top: 16rpx;
  left: 16rpx;
  border-width: 2rpx 0 0 2rpx;
}

.tr {
  top: 16rpx;
  right: 16rpx;
  border-width: 2rpx 2rpx 0 0;
}

.bl {
  bottom: 16rpx;
  left: 16rpx;
  border-width: 0 0 2rpx 2rpx;
}

.br {
  bottom: 16rpx;
  right: 16rpx;
  border-width: 0 2rpx 2rpx 0;
}

.viewport {
  position: relative;
  height: 520rpx;
  overflow: hidden;
  border-radius: 10rpx;
  background: #14241c;
}

.hero {
  width: 100%;
  height: 100%;
}

.vignette {
  position: absolute;
  inset: 0;
  box-shadow:
    inset 0 0 88rpx rgba(0, 0, 0, 0.5),
    inset 0 -120rpx 100rpx rgba(6, 14, 10, 0.45);
  pointer-events: none;
}

.weather-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.light-shaft {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.weather-sunny .light-shaft {
  background: linear-gradient(125deg, rgba(232, 196, 138, 0.18), transparent 42%, transparent 58%, rgba(212, 163, 89, 0.08));
}

.weather-rainy .weather-veil {
  background:
    linear-gradient(180deg, rgba(120, 150, 160, 0.12), transparent 40%),
    repeating-linear-gradient(
      -18deg,
      transparent,
      transparent 10rpx,
      rgba(180, 210, 220, 0.04) 10rpx,
      rgba(180, 210, 220, 0.04) 12rpx
    );
}

.weather-mist .weather-veil {
  background: radial-gradient(ellipse at 50% 70%, rgba(210, 220, 210, 0.14), transparent 60%);
}

.weather-cloudy .weather-veil {
  background: linear-gradient(180deg, rgba(30, 40, 36, 0.18), transparent 50%);
}

.hud-top {
  position: absolute;
  top: 20rpx;
  left: 22rpx;
  right: 22rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
}

.kicker {
  font-size: 16rpx;
  letter-spacing: 3rpx;
  color: rgba(45, 52, 40, 0.78);
  font-family: Georgia, 'Times New Roman', serif;
  padding: 6rpx 12rpx;
  border-radius: 4rpx;
  background: rgba(244, 239, 230, 0.55);
  text-shadow: 0 1rpx 0 rgba(255, 255, 255, 0.25);
}

.status {
  font-size: 18rpx;
  color: #7bc896;
  letter-spacing: 2rpx;
  padding: 4rpx 12rpx;
  border: 1rpx solid rgba(123, 200, 150, 0.35);
  background: rgba(8, 22, 14, 0.55);
}

.hud-bottom {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16rpx;
  padding: 110rpx 24rpx 22rpx;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(6, 14, 10, 0.42) 36%,
    rgba(6, 14, 10, 0.82) 68%,
    rgba(6, 14, 10, 0.94) 100%
  );
}

.identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.cn {
  font-size: 40rpx;
  line-height: 48rpx;
  color: #f4efe6;
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', Georgia, 'Times New Roman', serif;
  text-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.7);
}

.latin {
  font-size: 20rpx;
  line-height: 28rpx;
  color: #d5ddd6;
  font-style: italic;
  font-family: Georgia, 'Times New Roman', serif;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.65);
}

.family {
  margin-top: 4rpx;
  font-size: 18rpx;
  color: #b7c4bb;
  letter-spacing: 1rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.6);
}

.power {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2rpx;
  padding: 10rpx 14rpx;
  border: 1rpx solid rgba(212, 163, 89, 0.35);
  background: rgba(12, 24, 18, 0.72);
}

.power-label {
  font-size: 16rpx;
  letter-spacing: 3rpx;
  color: #8ba895;
}

.power-value {
  font-size: 44rpx;
  line-height: 48rpx;
  color: #e8c48a;
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', Georgia, 'Times New Roman', serif;
  font-variant-numeric: tabular-nums;
}

.power-bonus {
  font-size: 18rpx;
  color: #7bc896;
}
</style>
