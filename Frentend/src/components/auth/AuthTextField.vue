<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    modelValue: string
    placeholder: string
    error?: string
    password?: boolean
    revealed?: boolean
    optional?: boolean
    maxlength?: number
  }>(),
  {
    error: '',
    password: false,
    revealed: false,
    optional: false,
    maxlength: 80
  }
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:revealed': [value: boolean]
  blur: []
  confirm: []
}>()

const focused = ref(false)
const masked = computed((): boolean => props.password && !props.revealed)
const hasError = computed((): boolean => props.error.length > 0)

function readInputValue(event: unknown): string {
  if (typeof event !== 'object' || event === null || !('detail' in event)) {
    return ''
  }
  const detail = event.detail
  if (typeof detail !== 'object' || detail === null || !('value' in detail)) {
    return ''
  }
  const value = detail.value
  return typeof value === 'string' ? value : ''
}

function handleInput(event: unknown): void {
  emit('update:modelValue', readInputValue(event))
}

function handleBlur(): void {
  focused.value = false
  emit('blur')
}

function handleFocus(): void {
  focused.value = true
}

function handleConfirm(): void {
  emit('confirm')
}

function toggleRevealed(): void {
  emit('update:revealed', !props.revealed)
}
</script>

<template>
  <view class="field">
    <view class="label-row">
      <text class="label">{{ label }}</text>
      <text v-if="optional" class="optional">选填</text>
    </view>
    <view class="control" :class="{ 'is-focus': focused, 'is-error': hasError }">
      <input
        class="input"
        :value="modelValue"
        :password="masked"
        :placeholder="placeholder"
        placeholder-style="color: #8A8478; font-size: 28rpx;"
        confirm-type="done"
        :adjust-position="true"
        :cursor-spacing="120"
        :maxlength="maxlength"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        @confirm="handleConfirm"
      />
      <view v-if="password" class="toggle" @tap.stop="toggleRevealed">
        <text>{{ revealed ? '隐藏' : '显示' }}</text>
      </view>
    </view>
    <view class="error">
      <text v-if="hasError">{{ error }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.field {
  margin-bottom: 8rpx;
}

.label-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.label {
  color: #5c564c;
  font-size: 24rpx;
  line-height: 32rpx;
  font-weight: 700;
}

.optional {
  margin-left: 12rpx;
  color: #8a8478;
  font-size: 22rpx;
  line-height: 32rpx;
}

.control {
  display: flex;
  align-items: center;
  height: 96rpx;
  padding: 0 8rpx 0 24rpx;
  background: rgba(255, 255, 255, 0.62);
  border: 2rpx solid rgba(43, 40, 35, 0.12);
  border-radius: 18rpx;
}

.is-focus {
  border-color: #c4924a;
  background: #fffdf8;
}

.is-error {
  border-color: #b85d43;
}

.input {
  flex: 1;
  height: 96rpx;
  min-width: 0;
  color: #2b2823;
  font-size: 30rpx;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Helvetica Neue', sans-serif;
}

.toggle {
  flex-shrink: 0;
  min-width: 88rpx;
  height: 72rpx;
  padding: 0 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3f6b4e;
  font-size: 24rpx;
  font-weight: 700;
}

.error {
  min-height: 36rpx;
  margin-top: 8rpx;
  color: #b85d43;
  font-size: 22rpx;
  line-height: 32rpx;
}
</style>
