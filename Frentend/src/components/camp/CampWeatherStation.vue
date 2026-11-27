<script setup lang="ts">
import { computed } from 'vue'
import { CampWeather } from '@/enums/camp-weather'
import type { CampWeatherStation } from '@/types/views'

const props = defineProps<{
  station: CampWeatherStation
}>()

const weatherGlyph = computed((): string => {
  switch (props.station.weather) {
    case CampWeather.Sunny:
      return '☀'
    case CampWeather.Rainy:
      return '☂'
    case CampWeather.Mist:
      return '☁'
    case CampWeather.Cloudy:
    default:
      return '☁'
  }
})

const summary = computed((): string => {
  return `${props.station.seasonLabel} · ${props.station.weatherLabel} · ${props.station.temperatureC}℃`
})
</script>

<template>
  <view class="station" :class="`is-${station.weather}`">
    <view class="frame-outer">
      <view class="frame-inner">
        <view class="row-top">
          <text class="glyph">{{ weatherGlyph }}</text>
          <text class="summary">{{ summary }}</text>
          <text class="bonus">↑{{ station.bonusPercent }}%</text>
        </view>
        <text class="bonus-label">{{ station.bonusLabel }}</text>
        <text class="hint">{{ station.atmosphereHint }}</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.station {
  position: relative;
}

.frame-outer {
  padding: 2rpx;
  border-radius: 12rpx;
  background: linear-gradient(135deg, rgba(232, 196, 138, 0.55), rgba(122, 84, 36, 0.35), rgba(232, 196, 138, 0.4));
}

.frame-inner {
  padding: 18rpx 20rpx 16rpx;
  border-radius: 10rpx;
  border: 1rpx solid rgba(212, 163, 89, 0.18);
  background:
    radial-gradient(ellipse at 12% 0%, rgba(212, 163, 89, 0.1), transparent 46%),
    linear-gradient(160deg, rgba(18, 36, 28, 0.96), rgba(10, 22, 16, 0.98));
}

.row-top {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.glyph {
  font-size: 22rpx;
  color: #e8c48a;
  line-height: 1;
}

.summary {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  letter-spacing: 2rpx;
  color: #ece9df;
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', Georgia, 'Times New Roman', serif;
}

.bonus {
  flex-shrink: 0;
  font-size: 20rpx;
  color: #7bc896;
  letter-spacing: 1rpx;
  font-variant-numeric: tabular-nums;
}

.bonus-label {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 32rpx;
  color: #d4a359;
}

.hint {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  line-height: 30rpx;
  color: #7f9186;
}

.is-sunny .frame-inner {
  background:
    radial-gradient(ellipse at 85% 0%, rgba(232, 196, 138, 0.16), transparent 42%),
    linear-gradient(160deg, rgba(22, 40, 30, 0.96), rgba(10, 22, 16, 0.98));
}

.is-rainy .frame-inner {
  background:
    radial-gradient(ellipse at 50% 120%, rgba(110, 150, 170, 0.14), transparent 50%),
    linear-gradient(160deg, rgba(14, 30, 28, 0.96), rgba(8, 18, 16, 0.98));
}

.is-mist .frame-inner {
  background:
    radial-gradient(ellipse at 40% 30%, rgba(180, 200, 190, 0.08), transparent 55%),
    linear-gradient(160deg, rgba(16, 32, 26, 0.96), rgba(10, 20, 16, 0.98));
}
</style>
