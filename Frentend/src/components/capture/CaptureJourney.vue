<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  currentStep: 1 | 2 | 3 | 4
}

interface JourneyStep {
  id: 1 | 2 | 3 | 4
  label: string
}

const props = defineProps<Props>()

const STEPS: JourneyStep[] = [
  { id: 1, label: '取景' },
  { id: 2, label: '确认' },
  { id: 3, label: '解析' },
  { id: 4, label: '收录' }
]

const progressWidth = computed((): string => `${((props.currentStep - 1) / (STEPS.length - 1)) * 100}%`)

function stepClass(step: JourneyStep): string {
  if (step.id < props.currentStep) {
    return 'is-complete'
  }
  if (step.id === props.currentStep) {
    return 'is-current'
  }
  return 'is-pending'
}
</script>

<template>
  <view class="journey">
    <view class="track">
      <view class="track-progress" :style="{ width: progressWidth }" />
    </view>
    <view
      v-for="step in STEPS"
      :key="step.id"
      class="step"
      :class="stepClass(step)"
    >
      <view class="step-node">
        <text class="step-number">{{ step.id < currentStep ? '✓' : step.id }}</text>
      </view>
      <text class="step-label">{{ step.label }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.journey {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding: 4rpx 8rpx 12rpx;
}

.track {
  position: absolute;
  top: 24rpx;
  left: 52rpx;
  right: 52rpx;
  height: 2rpx;
  overflow: hidden;
  background: rgba(139, 168, 149, 0.24);
}

.track-progress {
  height: 100%;
  background: linear-gradient(90deg, #8e6a2f, #e2b95f);
  transition: width 0.45s cubic-bezier(0.25, 1, 0.5, 1);
}

.step {
  position: relative;
  z-index: 1;
  width: 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.step-node {
  width: 42rpx;
  height: 42rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2rpx solid #51665a;
  background: #102019;
  box-shadow: 0 0 0 5rpx #0f1914;
}

.step-number {
  color: #81958a;
  font-size: 18rpx;
  font-weight: 700;
}

.step-label {
  margin-top: 8rpx;
  color: #71847a;
  font-size: 18rpx;
  letter-spacing: 2rpx;
}

.is-current .step-node {
  border-color: #e0b85f;
  background: radial-gradient(circle, #d9a84b, #725021);
  box-shadow:
    0 0 0 5rpx #0f1914,
    0 0 18rpx rgba(224, 184, 95, 0.5);
  animation: currentPulse 1.8s ease-in-out infinite;
}

.is-current .step-number,
.is-current .step-label {
  color: #efd188;
}

.is-complete .step-node {
  border-color: #4a7a5d;
  background: #294b38;
}

.is-complete .step-number,
.is-complete .step-label {
  color: #8fb49c;
}

@keyframes currentPulse {
  50% {
    transform: scale(1.08);
    box-shadow:
      0 0 0 5rpx #0f1914,
      0 0 28rpx rgba(224, 184, 95, 0.68);
  }
}
</style>
