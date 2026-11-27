<script setup lang="ts">
interface Props {
  text: string
  tone?: 'gold' | 'mint' | 'ghost'
}

withDefaults(defineProps<Props>(), {
  tone: 'gold'
})
</script>

<template>
  <text class="badge" :class="`is-${tone}`">{{ text }}</text>
</template>

<style lang="scss" scoped>
.badge {
  display: inline-block;
  font-size: 20rpx;
  letter-spacing: 2rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
}

.is-gold {
  color: #07140f;
  background: linear-gradient(90deg, #f3d98a, #c9a14a);
}

.is-mint {
  color: #082018;
  background: linear-gradient(90deg, #7dffc4, #3fd89a);
}

.is-ghost {
  color: #e8c56a;
  background: rgba(232, 197, 106, 0.12);
  border: 1rpx solid rgba(232, 197, 106, 0.4);
}
</style>
