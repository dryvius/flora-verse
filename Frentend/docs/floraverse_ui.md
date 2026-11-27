# 《FloraVerse》UI 视觉与组件重构指令文档 (Cursor 专用)

## 1. 重构背景与风格定位

### 1.1 项目信息
- **技术栈**：Vue 3 + TypeScript + uni-app (微信小程序原生风格/TailwindCSS/SCSS)
- **目标平台**：微信小程序 (需适配胶囊按钮与底部安全区)

### 1.2 核心风格定义：自然博物志 / 草药学手札 (Naturalist Journal & Botanical Herbarium)
- **视觉概念**：将应用重构成一本探险家的**野外皮质手札**与**实体植物标本集**。
- **视觉特征**：
  - **色彩**：告别高对比黑金/荧光绿，采用**森林暗绿**为底色，配合**温润羊皮纸米白**卡片与**琥珀暖金/苔藓绿**做点缀。
  - **质感**：质朴的纸张纹理、沉稳的金属/橡木边框、印章式徽章、精细的科学插画与衬线体排版。
  - **结构**：清晰的物理层级感（背景纸张 -> 标本卡片 -> 金属衬线与徽章）。

---

## 2. 全局色彩与视觉变量定义 (Design Tokens)

请在全局样式文件（如 `styles/theme.scss` 或 Tailwind 配置）中添加或覆盖以下变量：

```css
:root {
  /* 背景色系统：深邃森林与深色纸张 */
  --bg-main: #0F1914;             /* 深度苔藓暗绿 (替换原死黑色) */
  --bg-card-dark: #16241D;        /* 深色卡片/容器底色 */
  --bg-paper-light: #F4EFE6;      /* 羊皮纸/温润米白 (用于亮色卡片或标本框) */
  
  /* 辅助与强调色系统 */
  --color-amber-gold: #D4A359;    /* 暖琥珀金 (用于选中态、稀有度、关键字) */
  --color-moss-green: #4A7A5D;    /* 活体苔藓绿 (替换原荧光绿色) */
  --color-sage-subtle: #8BA895;    /* 鼠尾草绿 (次要文字与边框) */
  --color-terracotta: #B85D43;    /* 陶土红 (用于标签、已收集印章、警示) */

  /* 文字颜色系统 */
  --text-primary: #ECE9DF;        /* 羊皮白 (主要标题与文字) */
  --text-secondary: #9AA89F;      /* 灰绿 (副标题、拉丁文、时间) */
  --text-dark-primary: #2B2823;   /* 深褐色 (用于亮色卡片内的标题) */

  /* 边框与阴影 */
  --border-subtle: rgba(212, 163, 89, 0.2); /* 细微金线边框 */
  --border-card: rgba(255, 255, 255, 0.08);   /* 微弱高光边框 */
  --shadow-card: 0 4px 16px rgba(0, 0, 0, 0.35); /* 实体深度阴影 */
}
```

---

## 3. 核心页面重构指南与组件规范

### 3.1 底部导航栏 (Bottom Navigation Bar)
* **核心问题修复**：解决左右图标分布不对称、中间 `+` 按钮突兀的问题。
* **重构方案**：
  1. **结构平铺**：采用标准的“三段式”或“对称四段式”布局。
     - **方案推荐**：`[营地] - [收录 (中央凸起主入口)] - [图鉴]`。
     - 将原有的“探索者/个人中心”移至“营地”页面的左上角用户头像处点击进入，保持底部导航精简。
  2. **中央收录按钮重构**：
     - 去除原有的淡绿色径向发光大圆球。
     - 设计为**黄铜罗盘/快门徽章**样式：古铜色微金属线框、内部嵌有黄铜指针或刻度纹理，中间为黄铜色 `+` 或相机图标。
  3. **导航栏背景**：半透明毛玻璃深绿色 `rgba(15, 25, 20, 0.85)` + 顶部 1px 细金线 `var(--border-subtle)`。

---

### 3.2 首页 / 营地 (Camp Page)
* **重构要求**：
  1. **顶部探索者卡片**：
     - 摒弃大块粗暴的黄色背景大圆圈。
     - 重构为“探险者徽章卡”：左侧圆形头像加金属复古边框，右侧排版“摘星重现 | 野外探索者”。
     - 数据看板（`物种 4 | 个体 5`）改为精致的竖线分隔仪表盘：使用无衬线硬朗数字搭配鼠尾草绿小字标签。
  2. **最近战利品 (Recent Loot)**：
     - 卡片布局统一采用**标准网格 (2列 Grid)**。
     - 标题“最近战利品”两侧增加细金线装饰（例如：`—— 最近战利品 ——`）。

---

### 3.3 植物卡片组件 (Plant Card Component - `PlantCard.vue`)
* **核心重构**：将原有的通用科技感卡片重构为**“博物标本卡片”**。
* **设计要素**：
  1. **标本展示区 (Top)**：
     - 带有微弱内阴影（`inset 0 0 10px rgba(0,0,0,0.4)`）的图框。
     - 支持无图片时的水彩质感镂空占位符，图片支持居中并带有精致的圆角。
  2. **信息铭牌区 (Bottom)**：
     - **植物中文名**：字体加粗、字号放大，使用羊皮白或墨黑色。
     - **拉丁学名**：使用 *Italic* 斜体、鼠尾草绿/灰色，呈现学术严谨感。
     - **科属信息与日期**：底部用微小字号弱化显示（如：`木犀科 · 2026-11-18`）。
  3. **状态与标记 (Badges)**：
     - 移除旧有的塑料感胶囊标签 `NEW` / `REPEAT`。
     - **新发现 (`NEW`)**：重构为右上方斜角贴纸或火漆印章样式（陶土红色背景，写有“新发现”或“NEW”）。
     - **重复/数量 (`x1`, `x2`)**：放在卡片右下角，用复古小数字圆章表示。

---

### 3.4 图鉴页面 (Codex / Field Guide Page)
* **重构要求**：
  1. **顶部 Tab 切换 (物种图鉴 vs 个体收藏)**：
     - 取消原有的“大块黄色高亮块”，改为滑动式木质/黄铜色下划线切页 indicator。
     - 选中的 Tab 文本高亮为琥珀金 `var(--color-amber-gold)`，未选中态为灰绿色。
  2. **图鉴进度指示**：
     - 在 Tab 下方增加图鉴收集度进度条：例如 `已解锁 4 / 120 种`，配备一条细长的金色进度条（琥珀金渐变）。

---

### 3.5 收录页面 (Capture / Scanner Page)
* **核心问题**：当前中间的黄色大圆球像低端网页按钮。
* **重构方案**：
  1. **取景器环形设计**：
     - 将中央圆环重构为**“野外经纬罗盘取景器”**。
     - 外圈使用细虚线与角度刻度线（0°, 90°, 180°, 270°），内圈为呼吸发光的黄铜线圈。
  2. **中央主按钮**：
     - 按钮设计为带纹理的黄铜快门键，文字“收录”采用古风或清晰的粗无衬线体。
  3. **从相册召唤框**：
     - 摒弃大面积无意义深色块，改为底部虚线框卡片，左侧配相册图标，右侧为优雅提示文字。

---

## 4. Cursor 执行指导法则 (Implementation Rules)

在代码重构过程中，请 Cursor 遵从以下规则：

1. **结构组件化**：
   - 将卡片提炼为通用组件 `SpecimenCard.vue`（标本卡）。
   - 将顶部 Navigation 和 Tab 栏提炼为独立的可复用组件。
2. **适配微信小程序**：
   - 样式尽量使用 `rpx` 或通用 CSS 变量。
   - 顶部必须保留并计算小程序原生胶囊（Menu Button）的高度与安全边距 (`uni.getMenuButtonBoundingClientRect()`)。
3. **避免过度装饰**：
   - 保持页面的呼吸感，利用内边距（Padding 24rpx - 32rpx）拉开卡片间距。
   - 避免乱用全屏纯黑，优先使用 `var(--bg-main)` 这种富含沉淀感的深森林黑绿色。
```

```markdown:FloraVerse 关键 CSS 示例代码片段:styles/herbarium_theme.scss
/* 供 Cursor 参考的标本卡片与质感 SCSS 示例 */

.specimen-card {
  background: var(--bg-card-dark);
  border: 1px solid var(--border-subtle);
  border-radius: 16rpx;
  overflow: hidden;
  position: relative;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  /* 标本卡片角饰 (复古四角金线) */
  &::before {
    content: '';
    position: absolute;
    top: 8rpx;
    left: 8rpx;
    right: 8rpx;
    bottom: 8rpx;
    border: 1px solid rgba(212, 163, 89, 0.15);
    border-radius: 12rpx;
    pointer-events: none;
    z-index: 1;
  }

  .specimen-image-wrapper {
    width: 100%;
    height: 240rpx;
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    
    .specimen-img {
      width: 80%;
      height: 80%;
      object-fit: contain;
    }
  }

  .specimen-info {
    padding: 20rpx 24rpx;

    .title {
      font-size: 32rpx;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.4;
    }

    .latin-name {
      font-size: 22rpx;
      font-style: italic;
      color: var(--color-sage-subtle);
      margin-top: 4rpx;
      font-family: 'Times New Roman', Georgia, serif;
    }

    .meta-footer {
      margin-top: 16rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 20rpx;
      color: var(--text-secondary);
    }
  }

  /* 新发现 - 印章/标签 */
  .badge-new {
    position: absolute;
    top: 16rpx;
    right: 16rpx;
    background: var(--color-terracotta);
    color: #FFF;
    font-size: 18rpx;
    font-weight: bold;
    padding: 4rpx 12rpx;
    border-radius: 6rpx;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    z-index: 2;
  }
}