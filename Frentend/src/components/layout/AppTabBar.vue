<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthState } from '@/composables/useAuthState'
import { AuthStatus } from '@/enums/auth-status'
import { MainTab } from '@/enums/main-tab'
import { useTabStore } from '@/stores/tab-store'
import { openCapture, switchToCollection, switchToHome, switchToMe, switchToRank } from '@/utils/navigation'

interface Props {
  variant?: 'overlay' | 'dock'
}

withDefaults(defineProps<Props>(), {
  variant: 'overlay'
})

const tabStore = useTabStore()
const { current } = storeToRefs(tabStore)
const { authStatus } = useAuthState()
const showPrivateTabs = ref(false)

function syncPrivateTabs(): void {
  showPrivateTabs.value = authStatus.value === AuthStatus.Authenticated
}

syncPrivateTabs()
watch(authStatus, (): void => {
  syncPrivateTabs()
})
onShow((): void => {
  syncPrivateTabs()
})

function handleHome(): void {
  switchToHome()
}

function handleCollection(): void {
  switchToCollection()
}

function handleRank(): void {
  switchToRank()
}

function handleMe(): void {
  switchToMe()
}

function handleCapture(): void {
  openCapture()
}
</script>

<template>
  <view class="tabbar" :class="variant">
    <view class="halo" />

    <view class="bar">
      <view class="rail-left" />
      <view class="rail-right" />

      <view class="item" :class="{ active: current === MainTab.Home }" @tap="handleHome">
        <text class="glyph glyph-camp">⌂</text>
        <text class="label">营地</text>
      </view>

      <view
        v-if="showPrivateTabs"
        class="item"
        :class="{ active: current === MainTab.Collection }"
        @tap="handleCollection">
        <text class="glyph glyph-codex">▣</text>
        <text class="label">图鉴</text>
      </view>

      <view class="slot" />

      <view
        v-if="showPrivateTabs"
        class="item"
        :class="{ active: current === MainTab.Rank }"
        @tap="handleRank">
        <text class="glyph glyph-rank">☰</text>
        <text class="label">排行</text>
      </view>

      <view class="item" :class="{ active: current === MainTab.Me }" @tap="handleMe">
        <text class="glyph glyph-me">◎</text>
        <text class="label">我的</text>
      </view>
    </view>

    <view class="shutter" @tap="handleCapture">
      <view class="bezel">
        <view class="tick n" />
        <view class="tick e" />
        <view class="tick s" />
        <view class="tick w" />
        <view class="core">
          <text class="mark">+</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tabbar {
  position: relative;
  overflow: visible;
  background-color: transparent;
}

.overlay {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background-color: transparent;
}

.dock {
  position: relative;
}

.halo {
  position: absolute;
  left: 50%;
  top: -76rpx;
  z-index: 1;
  width: 152rpx;
  height: 152rpx;
  margin-left: -76rpx;
  border-radius: 50%;
  background-color: #121c17;
  border: 1px solid rgba(212, 163, 89, 0.55);
  pointer-events: none;
}

.bar {
  position: relative;
  z-index: 2;
  box-sizing: content-box;
  height: 96rpx;
  display: flex;
  align-items: flex-start;
  padding: 0 4rpx 16px;
  padding-bottom: calc(16px + constant(safe-area-inset-bottom));
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background-color: #121c17;
}

.rail-left,
.rail-right {
  position: absolute;
  top: 0;
  height: 1px;
  background: rgba(212, 163, 89, 0.55);
}

.rail-left {
  left: 0;
  right: 50%;
  margin-right: 76rpx;
}

.rail-right {
  left: 50%;
  right: 0;
  margin-left: 76rpx;
}

.item {
  flex: 1;
  height: 96rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 18rpx;
  color: #8ba895;
  min-width: 0;
}

.active {
  color: #d4a359;
}

.glyph {
  width: 44rpx;
  height: 44rpx;
  line-height: 44rpx;
  text-align: center;
}

.glyph-camp {
  font-size: 36rpx;
}

.glyph-codex {
  font-size: 30rpx;
}

.glyph-rank {
  font-size: 30rpx;
}

.glyph-me {
  font-size: 30rpx;
}

.label {
  margin-top: 8rpx;
  font-size: 20rpx;
  line-height: 24rpx;
  letter-spacing: 1rpx;
}

.slot {
  width: 152rpx;
  height: 96rpx;
  flex-shrink: 0;
}

.shutter {
  position: absolute;
  left: 50%;
  top: -68rpx;
  z-index: 3;
  width: 136rpx;
  height: 136rpx;
  margin-left: -68rpx;
  border-radius: 50%;
  padding: 8rpx;
  background: linear-gradient(160deg, #f0d5a0 0%, #d4a359 42%, #8a5a28 100%);
  box-shadow:
    0 12rpx 28rpx rgba(0, 0, 0, 0.5),
    0 0 24rpx rgba(212, 163, 89, 0.32),
    inset 0 2rpx 0 rgba(255, 255, 255, 0.38);
}

.bezel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  position: relative;
  background: radial-gradient(circle at 50% 38%, #3a5246 0%, #15201b 72%);
  border: 2rpx solid rgba(62, 40, 16, 0.4);
}

.tick {
  position: absolute;
  background: #d4a359;
}

.n,
.s {
  width: 2rpx;
  height: 12rpx;
  left: 50%;
  margin-left: -1rpx;
}

.e,
.w {
  width: 12rpx;
  height: 2rpx;
  top: 50%;
  margin-top: -1rpx;
}

.n {
  top: 6rpx;
}

.s {
  bottom: 6rpx;
}

.e {
  right: 6rpx;
}

.w {
  left: 6rpx;
}

.core {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  bottom: 20rpx;
  left: 20rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #f0d5a0 0%, #d4a359 52%, #8a5a28 100%);
  box-shadow:
    inset 0 2rpx 0 rgba(255, 255, 255, 0.38),
    0 6rpx 12rpx rgba(0, 0, 0, 0.4);
}

.mark {
  color: #2b2823;
  font-size: 52rpx;
  font-weight: 700;
  line-height: 1;
  margin-top: -4rpx;
}
</style>
