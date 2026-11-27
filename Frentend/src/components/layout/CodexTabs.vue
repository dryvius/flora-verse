<script setup lang="ts">
interface CodexTab {
  id: string
  label: string
}

interface Props {
  tabs: CodexTab[]
  modelValue: string
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [id: string]
}>()

function handleTap(id: string): void {
  emit('update:modelValue', id)
}
</script>

<template>
  <view class="tabs">
    <view
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="{ active: modelValue === tab.id }"
      @tap="handleTap(tab.id)"
    >
      <text class="label">{{ tab.label }}</text>
      <view class="indicator" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tabs {
  display: flex;
  padding: 0 8rpx;
  border-bottom: 1px solid rgba(212, 163, 89, 0.16);
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18rpx 0 0;
}

.label {
  font-size: 28rpx;
  color: #8ba895;
  letter-spacing: 2rpx;
}

.active .label {
  color: #d4a359;
  font-weight: 700;
}

.indicator {
  margin-top: 14rpx;
  width: 56rpx;
  height: 4rpx;
  border-radius: 2rpx;
  background: transparent;
}

.active .indicator {
  background: linear-gradient(90deg, #c4924a, #e8c48a, #c4924a);
}
</style>
