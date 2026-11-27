# 《FloraVerse》UI V2 高级视觉、动效与沉浸式取景器重构规范 (Cursor 专用)

## 1. 重构目标与核心视觉升级

### 1.1 风格再强化：高级自然博物手札 (Botanical Herbarium V2)
在 V1 色彩系统的基础上，进一步引入**实体材质感、物理堆叠交互**与**专业野外观测仪 HUD**，彻底消除纯色块的网页感。

### 1.2 4 大高阶质感细节

1. **暗纹与颗粒噪点 (Noise & Texture)**：
   * 背景与标本卡片叠加 SVG 微噪点，消除 CSS 渐变的机械感。
   * **收录成功/档案解封**页的卡片背景加入**水彩植物叶脉暗纹 (Leaf Watermark)** 与 30% 透明度金色光晕。
2. **标本标签重塑 (火漆印章与邮戳贴纸)**：
   * 摒弃扁平胶囊，`NEW` 标签重构为**火漆印章 (Wax Seal)** 或 **锯齿边缘邮票贴纸**，带微弱投影与 3D 侧光。
3. **照片暗角与规范 (Vignette & Crop)**：
   * 所有采集照片统一采用 `object-fit: cover` 铺满图片框。
   * 封面图片内边缘叠加 10px 的内阴影暗角（`inset 0 0 12px rgba(0,0,0,0.5)`），确保任意实拍图都能融入复古色调。
4. **数字与刻度系统 (Serif & Technical Layout)**：
   * 拉丁文与数量标注统一使用古典衬线体（*Times New Roman* / *Georgia*），带微弱字间距（`letter-spacing: 1px`）。

---

## 2. 同物种卡片“扇形扑克牌”堆叠与展开组件 (`SpecimenStack.vue`)

### 2.1 堆叠规则与逻辑
* **同物种收录上限**：同一物种在图鉴/个体页中**最多保留 3 张**最高品质/最新的照片。
* **常态（折叠静止）**：
  * 主卡片（最新/标星）位于最上层（`z-index: 3`）。
  * 2 张历史卡片藏于下方，分别旋转 `-4deg` 与 `+4deg` 并向下偏移 `6rpx`，露出卡片角。
  * 卡片右上角显示复古黄铜色 `×3` 堆叠徽章。

### 2.2 扇形散开交互 (Fan-shaped Poker Spread)
当用户点击堆叠卡片时：
1. **全屏遮罩**：背景触发 `backdrop-filter: blur(8px)` + 半透明暗化遮罩。
2. **扇形扑克牌散开**：
   * 设置动画基点：`transform-origin: 50% 120%`（卡片底部下方中心点）。
   * **卡片 1（左）**：`transform: rotate(-14deg) translateY(-20rpx)`。
   * **卡片 2（中/主）**：`transform: rotate(0deg) translateY(-40rpx) scale(1.05)`（高亮聚焦）。
   * **卡片 3（右）**：`transform: rotate(14deg) translateY(-20rpx)`。
3. **滑动与聚焦**：
   * 用户左右滑动或点击某张卡片时，该卡片旋转回 `0deg` 并放大成为焦点，其它卡片自动向两侧偏移并降暗。
4. **收回**：点击背景空白处，通过弹簧动画平滑收拢回堆叠形态。

---

## 3. 相机拍照界面：野外博物学观测仪 HUD (`CaptureHUD.vue`)

在微信小程序 `<camera>` 组件上方覆盖一层全屏 HUD 界面，营造沉浸式观测体验。

### 3.1 观测仪取景框结构
1. **四角黄铜游标卡尺 (Brass Corner Brackets)**：
   * 屏幕四角放置复古 L 型黄铜金属描边（带有 `┌` `┐` `└` `┘` 刻度）。
2. **中央动态罗盘瞄准环**：
   * 双层同心圆环，外环标有 `0°` `90°` `180°` `270°` 方位指针，保持 `30s` 一圈的极慢旋转。
   * 内环为绿色虚线，当镜头稳定时从金色变为活体苔藓绿，提示“锁定目标中”。
3. **野外手札 HUD 文本**：
   * 左上角：`OBSERVATION MODE // BOTANICAL LENS v2.4`
   * 右上角：实时经纬度/时间打卡字段（例如：`2026.11.24 - FIELD NO.09`）
4. **黄铜快门按钮 (Shutter Button)**：
   * 底部中央为带有机械金属叶片纹理的快门圆键，按下时触发物理下沉与金色光圈涟漪扩散。

---

## 4. 关键动画与性能规范

所有动画必须基于 CSS `transform` / `opacity` 实现，确保微信小程序 60fps 帧率：

```scss
/* 缓动曲线定义 */
$ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* 弹簧回弹 */
$ease-smooth: cubic-bezier(0.25, 1, 0.5, 1);    /* 丝滑平滑 */

/* 1. 列表瀑布流交错入场 */
@keyframes cardStaggerIn {
  from {
    opacity: 0;
    transform: translateY(30rpx) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 2. 火漆印章盖章动效 */
@keyframes stampDown {
  0% { transform: scale(2) rotate(-15deg); opacity: 0; }
  70% { transform: scale(0.9) rotate(-15deg); opacity: 1; }
  100% { transform: scale(1) rotate(-15deg); }
}

/* 3. 扇形散开动画 */
.fan-card-left {
  transition: transform 0.4s $ease-spring;
  transform: rotate(-14deg) translateY(-20rpx);
}
.fan-card-center {
  transition: transform 0.4s $ease-spring;
  transform: rotate(0deg) translateY(-40rpx) scale(1.05);
}
.fan-card-right {
  transition: transform 0.4s $ease-spring;
  transform: rotate(14deg) translateY(-20rpx);
}
```

---

## 5. SCSS 样式与核心 DOM 结构参考 (Cursor 落地代码)

### 5.1 同物种卡片堆叠与扇形展开 DOM 结构 (`SpecimenStack.vue`)

```html
<template>
  <view class="specimen-stack-wrapper" :class="{ 'is-expanded': isExpanded }">
    <!-- 背景半透明高斯模糊遮罩 -->
    <view class="overlay-mask" v-if="isExpanded" @click="toggleExpand(false)"></view>

    <!-- 扇形/堆叠卡片组 -->
    <view class="cards-container" @click="!isExpanded && toggleExpand(true)">
      <view 
        v-for="(card, index) in items.slice(0, 3)" 
        :key="card.id"
        class="specimen-card-item"
        :class="getCardClass(index)"
        :style="getCardStyle(index)"
        @click.stop="onCardSelect(index)"
      >
        <!-- 图片与暗角 -->
        <view class="image-box">
          <image :src="card.imageUrl" mode="aspectFill" class="plant-img" />
          <view class="vignette-shadow"></view>
        </view>
        
        <!-- 标本卡铭牌 -->
        <view class="card-meta">
          <text class="title">{{ card.name }}</text>
          <text class="latin">{{ card.latinName }}</text>
        </view>

        <!-- 火漆印章 / 标签 -->
        <view class="wax-seal" v-if="card.isNew">NEW</view>
      </view>

      <!-- 堆叠数量徽章 (仅在折叠时显示) -->
      <view class="stack-badge" v-if="!isExpanded && items.length > 1">
        <text class="badge-text">×{{ items.length }}</text>
      </view>
    </view>
  </view>
</template>
```

### 5.2 全局 Noise 与暗纹 SCSS

```scss
/* 在 styles/theme.scss 中引入颗粒噪点背景 */
.bg-herbarium-pattern {
  background-color: var(--bg-main);
  background-image: radial-gradient(rgba(212, 163, 89, 0.05) 1px, transparent 0);
  background-size: 24rpx 24rpx;
}

/* 收录成功页 - 水印与柔光 */
.success-card-bg {
  position: relative;
  background: var(--bg-card-dark);
  border: 1px solid var(--border-subtle);
  border-radius: 20rpx;
  overflow: hidden;
  
  /* 背后柔和金色放射光晕 */
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 300rpx;
    height: 300rpx;
    background: radial-gradient(circle, rgba(212, 163, 89, 0.15) 0%, transparent 70%);
    pointer-events: none;
  }
}

/* 火漆印章样式 */
.wax-seal {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 64rpx;
  height: 64rpx;
  background: radial-gradient(circle, #C24A32 60%, #9E3621 100%);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: #F4EFE6;
  font-size: 18rpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.4), inset 0 2rpx 4rpx rgba(255, 255, 255, 0.3);
  transform: rotate(-12deg);
  animation: stampDown 0.4s $ease-spring;
}
```