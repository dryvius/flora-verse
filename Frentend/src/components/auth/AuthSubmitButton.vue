<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'

const props = defineProps<{
  text: string
  disabled: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  submit: []
  invalid: []
}>()

function handleSubmit(): void {
  if (props.disabled || props.loading) {
    return
  }
  emit('submit')
}

function handleInvalid(): void {
  emit('invalid')
}
</script>

<template>
  <view class="submit">
    <AppButton :text="text" :disabled="disabled || loading" :loading="loading" @tap="handleSubmit" />
    <view v-if="disabled && !loading" class="mask" @tap="handleInvalid" />
  </view>
</template>

<style lang="scss" scoped>
.submit {
  position: relative;
}

.mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
</style>
