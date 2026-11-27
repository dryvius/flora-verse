import { computed, onMounted, onUnmounted, ref, type ComputedRef } from 'vue'

interface WindowMetrics {
  windowWidth: number
  windowHeight: number
  safeBottom: number
}

interface FrameBox {
  top: number
  left: number
  width: number
  height: number
}

interface CaptureFrameLayout {
  pageHeight: number
  frame: FrameBox
  guide: FrameBox
  album: FrameBox
  scope: FrameBox
  orbit: FrameBox
  lockRing: FrameBox
  status: FrameBox
  shutter: FrameBox
  shutterLabel: FrameBox
  statusDot: FrameBox
  statusText: FrameBox
  bracketTl: FrameBox
  bracketTr: FrameBox
  bracketBl: FrameBox
  bracketBr: FrameBox
  obsKicker: FrameBox
  obsName: FrameBox
  stampDate: FrameBox
  stampNo: FrameBox
  labelN: FrameBox
  labelE: FrameBox
  labelS: FrameBox
  labelW: FrameBox
  tickN: FrameBox
  tickE: FrameBox
  tickS: FrameBox
  tickW: FrameBox
  crossH: FrameBox
  crossV: FrameBox
  crossDot: FrameBox
}

export interface CaptureHudStyles {
  page: string
  frame: string
  guide: string
  album: string
  scope: string
  orbit: string
  lockRing: string
  status: string
  shutter: string
  shutterLabel: string
  statusDot: string
  statusText: string
  bracketTl: string
  bracketTr: string
  bracketBl: string
  bracketBr: string
  obsKicker: string
  obsName: string
  stampDate: string
  stampNo: string
  labelN: string
  labelE: string
  labelS: string
  labelW: string
  tickN: string
  tickE: string
  tickS: string
  tickW: string
  crossH: string
  crossV: string
  crossDot: string
}

const SIDE = 16
const FRAME_TOP = 10
const FRAME_GAP = 12
const GUIDE_HEIGHT = 64
const ALBUM_HEIGHT = 76
const DOCK_GAP = 10
const DOCK_BOTTOM = 12
const HEADER_TOP = 14
const HEADER_HEIGHT = 34
const HEADER_GAP = 12
const BOTTOM_PAD = 16
const STATUS_HEIGHT = 32
const SHUTTER_SIZE = 66
const GAP_STATUS = 14
const GAP_SHUTTER = 16
const SCOPE_MAX = 420
const BRACKET_SIZE = 20
const BRACKET_INSET = 12
const LABEL_INSET = 5

function px(value: number): string {
  return `${Math.round(value)}px`
}

function readSafeBottom(info: UniApp.GetSystemInfoResult): number {
  const inset = info.safeAreaInsets?.bottom
  if (typeof inset === 'number' && inset > 0) {
    return inset
  }
  if (info.safeArea && info.screenHeight > info.safeArea.bottom) {
    return info.screenHeight - info.safeArea.bottom
  }
  return 0
}

function readWindowMetrics(): WindowMetrics {
  const info = uni.getSystemInfoSync()
  return {
    windowWidth: info.windowWidth,
    windowHeight: info.windowHeight,
    safeBottom: readSafeBottom(info)
  }
}

function buildCaptureFrameLayout(metrics: WindowMetrics): CaptureFrameLayout {
  const frameWidth = Math.max(metrics.windowWidth - SIDE * 2, 240)
  const albumTop = metrics.windowHeight - DOCK_BOTTOM - metrics.safeBottom - ALBUM_HEIGHT
  const guideTop = albumTop - DOCK_GAP - GUIDE_HEIGHT
  const frameHeight = Math.max(guideTop - FRAME_GAP - FRAME_TOP, 280)
  const frame: FrameBox = {
    top: FRAME_TOP,
    left: SIDE,
    width: frameWidth,
    height: frameHeight
  }

  const headerBlock = HEADER_TOP + HEADER_HEIGHT + HEADER_GAP
  let bottomPad = BOTTOM_PAD
  let shutterSize = SHUTTER_SIZE
  let statusHeight = STATUS_HEIGHT
  let gapStatus = GAP_STATUS
  let gapShutter = GAP_SHUTTER

  const measureScope = (): number => {
    const available = frame.height - headerBlock - bottomPad
    const chrome = statusHeight + shutterSize + gapStatus + gapShutter
    return Math.min(frame.width - 48, SCOPE_MAX, available - chrome)
  }

  let scopeSize = measureScope()
  if (scopeSize < 190) {
    shutterSize = 56
    statusHeight = 30
    gapStatus = 8
    gapShutter = 10
    bottomPad = 12
    scopeSize = measureScope()
  }
  if (scopeSize < 120) {
    bottomPad = 8
    gapStatus = 6
    gapShutter = 6
    scopeSize = measureScope()
  }
  scopeSize = Math.max(scopeSize, 96)

  const available = frame.height - headerBlock - bottomPad
  const chrome = statusHeight + shutterSize + gapStatus + gapShutter
  const overflow = scopeSize + chrome - available
  if (overflow > 0) {
    scopeSize = Math.max(scopeSize - overflow, 96)
  }
  const scopeTop = headerBlock + Math.max(available - (scopeSize + chrome), 0)
  const scopeLeft = (frame.width - scopeSize) / 2
  const statusWidth = Math.min(Math.max(scopeSize - 8, 188), 300, frame.width - 24)
  const statusTop = scopeTop + scopeSize + gapStatus
  const shutterTop = statusTop + statusHeight + gapShutter

  const headerSide = 36
  const stampWidth = Math.min(118, Math.round((frame.width - headerSide * 2) * 0.38))
  const nameWidth = frame.width - headerSide * 2 - stampWidth - 10
  const orbitInset = Math.min(Math.max(34, scopeSize * 0.14), scopeSize * 0.22)
  const ringGap = Math.max(12, scopeSize * 0.06)
  const orbitSize = scopeSize - orbitInset * 2
  const ringInset = orbitInset + ringGap
  const ringSize = Math.max(scopeSize - ringInset * 2, 48)
  const labelHeight = 16

  return {
    pageHeight: metrics.windowHeight,
    frame,
    guide: { top: guideTop, left: SIDE, width: frameWidth, height: GUIDE_HEIGHT },
    album: { top: albumTop, left: SIDE, width: frameWidth, height: ALBUM_HEIGHT },
    scope: { top: scopeTop, left: scopeLeft, width: scopeSize, height: scopeSize },
    orbit: { top: orbitInset, left: orbitInset, width: orbitSize, height: orbitSize },
    lockRing: { top: ringInset, left: ringInset, width: ringSize, height: ringSize },
    status: {
      top: statusTop,
      left: (frame.width - statusWidth) / 2,
      width: statusWidth,
      height: statusHeight
    },
    shutter: {
      top: shutterTop,
      left: (frame.width - shutterSize) / 2,
      width: shutterSize,
      height: shutterSize
    },
    shutterLabel: {
      top: LABEL_INSET,
      left: LABEL_INSET,
      width: shutterSize - LABEL_INSET * 2,
      height: shutterSize - LABEL_INSET * 2
    },
    statusDot: { top: (statusHeight - 8) / 2, left: 10, width: 8, height: 8 },
    statusText: { top: 0, left: 0, width: statusWidth, height: statusHeight },
    bracketTl: { top: BRACKET_INSET, left: BRACKET_INSET, width: BRACKET_SIZE, height: BRACKET_SIZE },
    bracketTr: {
      top: BRACKET_INSET,
      left: frame.width - BRACKET_INSET - BRACKET_SIZE,
      width: BRACKET_SIZE,
      height: BRACKET_SIZE
    },
    bracketBl: {
      top: frame.height - BRACKET_INSET - BRACKET_SIZE,
      left: BRACKET_INSET,
      width: BRACKET_SIZE,
      height: BRACKET_SIZE
    },
    bracketBr: {
      top: frame.height - BRACKET_INSET - BRACKET_SIZE,
      left: frame.width - BRACKET_INSET - BRACKET_SIZE,
      width: BRACKET_SIZE,
      height: BRACKET_SIZE
    },
    obsKicker: { top: HEADER_TOP, left: headerSide, width: nameWidth, height: 15 },
    obsName: { top: HEADER_TOP + 17, left: headerSide, width: nameWidth, height: 16 },
    stampDate: {
      top: HEADER_TOP,
      left: frame.width - headerSide - stampWidth,
      width: stampWidth,
      height: 15
    },
    stampNo: {
      top: HEADER_TOP + 17,
      left: frame.width - headerSide - stampWidth,
      width: stampWidth,
      height: 16
    },
    labelN: { top: orbitInset - labelHeight - 2, left: 0, width: scopeSize, height: labelHeight },
    labelS: { top: scopeSize - orbitInset + 2, left: 0, width: scopeSize, height: labelHeight },
    labelE: {
      top: (scopeSize - labelHeight) / 2,
      left: scopeSize - orbitInset + 4,
      width: orbitInset - 8,
      height: labelHeight
    },
    labelW: {
      top: (scopeSize - labelHeight) / 2,
      left: 2,
      width: orbitInset - 6,
      height: labelHeight
    },
    tickN: { top: 0, left: orbitSize / 2 - 1, width: 2, height: 10 },
    tickS: { top: orbitSize - 10, left: orbitSize / 2 - 1, width: 2, height: 10 },
    tickE: { top: orbitSize / 2 - 1, left: orbitSize - 10, width: 10, height: 2 },
    tickW: { top: orbitSize / 2 - 1, left: 0, width: 10, height: 2 },
    crossH: { top: scopeSize / 2 - 1, left: scopeSize * 0.4, width: scopeSize * 0.2, height: 2 },
    crossV: { top: scopeSize * 0.4, left: scopeSize / 2 - 1, width: 2, height: scopeSize * 0.2 },
    crossDot: { top: scopeSize / 2 - 3, left: scopeSize / 2 - 3, width: 6, height: 6 }
  }
}

function boxStyle(box: FrameBox): string {
  return `top:${px(box.top)};left:${px(box.left)};width:${px(box.width)};height:${px(box.height)};`
}

function lineStyle(box: FrameBox): string {
  return `${boxStyle(box)}line-height:${px(box.height)};`
}

function toCaptureHudStyles(layout: CaptureFrameLayout): CaptureHudStyles {
  return {
    page: `height:${px(layout.pageHeight)};`,
    frame: boxStyle(layout.frame),
    guide: boxStyle(layout.guide),
    album: boxStyle(layout.album),
    scope: boxStyle(layout.scope),
    orbit: boxStyle(layout.orbit),
    lockRing: boxStyle(layout.lockRing),
    status: boxStyle(layout.status),
    shutter: boxStyle(layout.shutter),
    shutterLabel: lineStyle(layout.shutterLabel),
    statusDot: boxStyle(layout.statusDot),
    statusText: lineStyle(layout.statusText),
    bracketTl: boxStyle(layout.bracketTl),
    bracketTr: boxStyle(layout.bracketTr),
    bracketBl: boxStyle(layout.bracketBl),
    bracketBr: boxStyle(layout.bracketBr),
    obsKicker: lineStyle(layout.obsKicker),
    obsName: lineStyle(layout.obsName),
    stampDate: lineStyle(layout.stampDate),
    stampNo: lineStyle(layout.stampNo),
    labelN: lineStyle(layout.labelN),
    labelE: lineStyle(layout.labelE),
    labelS: lineStyle(layout.labelS),
    labelW: lineStyle(layout.labelW),
    tickN: boxStyle(layout.tickN),
    tickE: boxStyle(layout.tickE),
    tickS: boxStyle(layout.tickS),
    tickW: boxStyle(layout.tickW),
    crossH: boxStyle(layout.crossH),
    crossV: boxStyle(layout.crossV),
    crossDot: boxStyle(layout.crossDot)
  }
}

function refreshMetrics(metrics: { value: WindowMetrics }): void {
  metrics.value = readWindowMetrics()
}

export function useCaptureFrameLayout(): { styles: ComputedRef<CaptureHudStyles> } {
  const metrics = ref<WindowMetrics>(readWindowMetrics())

  function handleResize(): void {
    refreshMetrics(metrics)
  }

  onMounted((): void => {
    handleResize()
    if (typeof window === 'undefined') {
      return
    }
    window.addEventListener('resize', handleResize)
  })

  onUnmounted((): void => {
    if (typeof window === 'undefined') {
      return
    }
    window.removeEventListener('resize', handleResize)
  })

  const styles = computed((): CaptureHudStyles => {
    return toCaptureHudStyles(buildCaptureFrameLayout(metrics.value))
  })

  return { styles }
}
