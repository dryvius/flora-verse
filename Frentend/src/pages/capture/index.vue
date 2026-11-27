<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, onMounted, onUnmounted, ref } from "vue";
import CaptureHUD from "@/components/capture/CaptureHUD.vue";
import { choosePlantImage } from "@/composables/useChoosePlantImage";
import { useCaptureFrameLayout } from "@/composables/useCaptureFrameLayout";
import { ERROR_CODES } from "@/constants/error-codes";
import { useCaptureSessionStore } from "@/stores/capture-session-store";
import { BusinessError, toUserMessage } from "@/utils/business-error";
import { enterPrivatePage, openCapturePreview, showErrorToast } from "@/utils/navigation";
import { hasAuthenticatedSession } from "@/utils/private-access";

const session = useCaptureSessionStore();
const { styles } = useCaptureFrameLayout();
const locked = ref(false);
const cameraReady = ref(false);
const cameraFailed = ref(false);
const shooting = ref(false);
const pressed = ref(false);
const flashVisible = ref(false);
let readyTimer = 0;
let lockTimer = 0;

const fieldDate = computed((): string => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}.${month}.${day}`;
});

const fieldNo = computed((): string => {
    return `FIELD NO.${String(new Date().getHours()).padStart(2, "0")}`;
});

const aimingLocked = computed((): boolean => {
    return locked.value && cameraReady.value && !cameraFailed.value;
});

const lockStatus = computed((): string => {
    if (cameraFailed.value) {
        return "镜头不可用，可改从相册选择";
    }
    if (!cameraReady.value) {
        return "正在校准光线与焦距";
    }
    if (!locked.value) {
        return "将整株放入圆环，并保持稳定";
    }
    return "目标已锁定，按下下方快门";
});

onShow((): void => {
    enterPrivatePage();
});

onMounted((): void => {
    if (!hasAuthenticatedSession()) {
        return;
    }
    lockTimer = setTimeout((): void => {
        if (!cameraFailed.value) {
            locked.value = true;
        }
    }, 1200) as unknown as number;
    readyTimer = setTimeout((): void => {
        if (!cameraFailed.value) {
            cameraReady.value = true;
        }
    }, 900) as unknown as number;
});

onUnmounted((): void => {
    clearTimeout(lockTimer);
    clearTimeout(readyTimer);
});

async function startFrom(source: "camera" | "album"): Promise<void> {
    try {
        const filePath = await choosePlantImage(source);
        session.beginSession(filePath);
        openCapturePreview();
    } catch (error) {
        if (error instanceof BusinessError && error.code === ERROR_CODES.USER_CANCELLED) {
            return;
        }
        showErrorToast(toUserMessage(error, "无法获取图片"));
    }
}

function handleAlbum(): void {
    void startFrom("album");
}

function triggerShutterFeedback(): void {
    pressed.value = true;
    flashVisible.value = true;
    setTimeout((): void => {
        pressed.value = false;
    }, 220);
    setTimeout((): void => {
        flashVisible.value = false;
    }, 160);
}

function handleShutter(): void {
    if (shooting.value) {
        return;
    }
    // #ifdef MP-WEIXIN
    if (!cameraFailed.value) {
        if (!cameraReady.value || !locked.value) {
            showErrorToast("请将植物放入圆环并保持稳定");
            return;
        }
        triggerShutterFeedback();
        shooting.value = true;
        const ctx = uni.createCameraContext();
        ctx.takePhoto({
            quality: "high",
            success: (res): void => {
                shooting.value = false;
                const path = res.tempImagePath;
                if (!path) {
                    showErrorToast("快门未拍到画面，请再试一次");
                    return;
                }
                session.beginSession(path);
                openCapturePreview();
            },
            fail: (): void => {
                shooting.value = false;
                showErrorToast("快门未锁定，请再试一次");
            },
        });
        return;
    }
    // #endif
    triggerShutterFeedback();
    void startFrom("camera");
}

function handleCameraError(): void {
    cameraFailed.value = true;
    cameraReady.value = false;
    locked.value = false;
}

function handleCameraReady(): void {
    cameraFailed.value = false;
    cameraReady.value = true;
}
</script>

<template>
    <view class="page" :style="styles.page">
        <!-- #ifdef MP-WEIXIN -->
        <camera
            v-if="!cameraFailed"
            id="flora-camera"
            class="lens"
            :style="styles.frame"
            device-position="back"
            flash="off"
            resolution="medium"
            frame-size="large"
            @error="handleCameraError"
            @initdone="handleCameraReady" />
        <view v-else class="lens-fallback" :style="styles.frame" />
        <cover-view class="hud" :style="styles.frame">
            <cover-view class="bracket tl" :style="styles.bracketTl" />
            <cover-view class="bracket tr" :style="styles.bracketTr" />
            <cover-view class="bracket bl" :style="styles.bracketBl" />
            <cover-view class="bracket br" :style="styles.bracketBr" />
            <cover-view class="obs-kicker" :style="styles.obsKicker">OBSERVATION MODE</cover-view>
            <cover-view class="obs-name" :style="styles.obsName">BOTANICAL LENS v2.4</cover-view>
            <cover-view class="stamp-date align-right" :style="styles.stampDate">{{ fieldDate }}</cover-view>
            <cover-view class="stamp-no align-right" :style="styles.stampNo">{{ fieldNo }}</cover-view>
            <cover-view class="scope" :class="{ 'is-locked': aimingLocked }" :style="styles.scope">
                <cover-view class="orbit" :style="styles.orbit">
                    <cover-view class="tick" :style="styles.tickN" />
                    <cover-view class="tick" :style="styles.tickE" />
                    <cover-view class="tick" :style="styles.tickS" />
                    <cover-view class="tick" :style="styles.tickW" />
                </cover-view>
                <cover-view class="deg n-label" :style="styles.labelN">0°</cover-view>
                <cover-view class="deg e-label" :style="styles.labelE">90°</cover-view>
                <cover-view class="deg s-label" :style="styles.labelS">180°</cover-view>
                <cover-view class="deg w-label" :style="styles.labelW">270°</cover-view>
                <cover-view class="lock-ring" :style="styles.lockRing" />
                <cover-view class="cross-v" :style="styles.crossV" />
                <cover-view class="cross-h" :style="styles.crossH" />
                <cover-view class="cross-dot" :style="styles.crossDot" />
            </cover-view>
            <cover-view class="lock-status" :class="{ ready: aimingLocked }" :style="styles.status">
                <cover-view class="status-dot" :style="styles.statusDot" />
                <cover-view class="status-text" :style="styles.statusText">{{ lockStatus }}</cover-view>
            </cover-view>
            <cover-view class="shutter" :class="{ pressed }" :style="styles.shutter" @tap="handleShutter">
                <cover-view class="shutter-label" :style="styles.shutterLabel">收录</cover-view>
            </cover-view>
        </cover-view>
        <!-- #endif -->

        <!-- #ifndef MP-WEIXIN -->
        <view class="lens-fallback" :style="styles.frame" />
        <CaptureHUD
            :styles="styles"
            :locked="aimingLocked"
            :status-text="lockStatus"
            :field-date="fieldDate"
            :field-no="fieldNo"
            @shutter="handleShutter" />
        <!-- #endif -->

        <view class="dock-guide" :style="styles.guide">
            <text class="guide-title">如何完成一次收录</text>
            <view class="guide-steps">
                <text class="guide-step"><text class="guide-no">01</text>对准整株</text>
                <text class="guide-step"><text class="guide-no">02</text>保持稳定</text>
                <text class="guide-step"><text class="guide-no">03</text>点击收录</text>
            </view>
        </view>
        <view class="dock-album" :style="styles.album" @tap="handleAlbum">
            <view class="album-icon">
                <view class="album-frame" />
                <view class="album-sun" />
            </view>
            <view class="album-copy">
                <text class="album-title">从相册召唤</text>
                <text class="album-desc">选择已经拍好的照片，收入手札</text>
            </view>
        </view>
        <cover-view v-if="flashVisible" class="capture-flash" />
    </view>
</template>

<style lang="scss" scoped>
@import "../../styles/capture-hud.scss";

.page {
    width: 100%;
    position: relative;
    overflow: hidden;
    background-color: #0f1914;
}

.lens,
.lens-fallback {
    position: absolute;
    z-index: 1;
    border-radius: 14px;
}

.lens-fallback {
    overflow: hidden;
    background-color: #101c16;
    background-image: radial-gradient(circle at 50% 42%, #1d3329 0%, #0c1511 72%);
}

.dock-guide,
.dock-album {
    position: absolute;
    z-index: 6;
    box-sizing: border-box;
}

.dock-guide {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 16px;
    border-left: 3px solid #d4a359;
    border-radius: 10px;
    background: rgba(16, 28, 22, 0.96);
}

.guide-title {
    color: #e0c27c;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
}

.guide-steps {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
}

.guide-step {
    color: #c5d1c9;
    font-size: 12px;
}

.guide-no {
    margin-right: 4px;
    color: #e0b56a;
    font-family: Georgia, "Times New Roman", serif;
}

.dock-album {
    display: flex;
    align-items: center;
    padding: 0 16px;
    border: 1px dashed rgba(212, 163, 89, 0.85);
    border-radius: 12px;
    background: rgba(22, 36, 29, 0.96);
}

.album-icon {
    width: 36px;
    height: 36px;
    margin-right: 14px;
    flex-shrink: 0;
    position: relative;
}

.album-frame {
    position: absolute;
    top: 7px;
    right: 4px;
    bottom: 7px;
    left: 4px;
    border: 1px solid #8ba895;
    border-radius: 4px;
}

.album-sun {
    position: absolute;
    top: 11px;
    right: 8px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #d4a359;
}

.album-copy {
    min-width: 0;
    flex: 1;
}

.album-title {
    display: block;
    color: #ece9df;
    font-size: 16px;
    font-weight: 700;
}

.album-desc {
    display: block;
    margin-top: 4px;
    color: #9aa89f;
    font-size: 12px;
}

.capture-flash {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 30;
    background-color: rgba(255, 249, 226, 0.92);
    pointer-events: none;
    animation: cameraFlash 0.16s ease-out both;
}

@keyframes cameraFlash {
    from {
        opacity: 0.95;
    }

    to {
        opacity: 0;
    }
}
</style>
