<script setup lang="ts">
const emit = defineEmits<{
  explore: []
}>()

function handleExplore(): void {
  emit('explore')
}
</script>

<template>
  <view class="empty">
    <view class="brass-outer">
      <view class="brass-inner">
        <text class="kicker">GREENHOUSE · AWAITING</text>
        <text class="title">温室仍是空的</text>
        <text class="desc">收录第一株植物后，这里将展示你的明星标本与环境加成。</text>
        <view class="cta" @tap="handleExplore">
          <text class="cta-text">出发探索</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.empty {
  width: 100%;
}

.brass-outer {
  padding: 3rpx;
  border-radius: 18rpx;
  background: linear-gradient(145deg, rgba(232, 196, 138, 0.45), rgba(122, 84, 36, 0.3), rgba(232, 196, 138, 0.4));
}

.brass-inner {
  min-height: 420rpx;
  padding: 48rpx 36rpx;
  border-radius: 16rpx;
  border: 1rpx solid rgba(212, 163, 89, 0.18);
  background:
    radial-gradient(circle at 50% 30%, rgba(212, 163, 89, 0.08), transparent 50%),
    #0c1812;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.kicker {
  font-size: 16rpx;
  letter-spacing: 3rpx;
  color: rgba(232, 196, 138, 0.7);
  font-family: Georgia, 'Times New Roman', serif;
}

.title {
  margin-top: 18rpx;
  font-size: 36rpx;
  color: #ece9df;
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', Georgia, 'Times New Roman', serif;
}

.desc {
  margin-top: 14rpx;
  font-size: 22rpx;
  line-height: 34rpx;
  color: #7f9186;
  max-width: 420rpx;
}

.cta {
  margin-top: 32rpx;
  padding: 14rpx 36rpx;
  border: 1rpx solid rgba(212, 163, 89, 0.45);
  background: rgba(212, 163, 89, 0.12);
}

.cta-text {
  font-size: 24rpx;
  letter-spacing: 4rpx;
  color: #e8c48a;
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', Georgia, 'Times New Roman', serif;
}
</style>
