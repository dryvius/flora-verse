<script setup lang="ts">
interface Props {
  text: string
  type?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'primary',
  disabled: false,
  loading: false
})

const emit = defineEmits<{
  tap: []
}>()

function handleTap(): void {
  if (props.disabled || props.loading) {
    return
  }
  emit('tap')
}
</script>

<template>
  <button
    class="app-button"
    :class="[`is-${type}`, { 'is-disabled': disabled || loading }]"
    hover-class="is-hover"
    @tap="handleTap"
  >
    <text class="label">{{ loading ? '施法中…' : text }}</text>
  </button>
</template>

<style lang="scss" scoped>
.app-button {
  width: 100%;
  height: 92rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
}

.label {
  position: relative;
  z-index: 1;
}

.is-primary {
  color: #07140f;
  background: linear-gradient(180deg, #f4de9a 0%, #c8963a 100%);
  box-shadow: 0 10rpx 28rpx rgba(232, 197, 106, 0.28), inset 0 2rpx 0 rgba(255, 255, 255, 0.35);
}

.is-secondary {
  color: #7dffc4;
  background: rgba(93, 255, 177, 0.1);
  border: 1rpx solid rgba(93, 255, 177, 0.45);
}

.is-ghost {
  color: #c5d4cb;
  background: transparent;
  border: 1rpx solid rgba(232, 197, 106, 0.28);
}

.is-disabled {
  opacity: 0.45;
}

.is-hover {
  opacity: 0.88;
}
</style>
