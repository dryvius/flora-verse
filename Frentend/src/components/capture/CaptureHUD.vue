<script setup lang="ts">
import { ref } from "vue";
import type { CaptureHudStyles } from "@/composables/useCaptureFrameLayout";

interface Props {
    styles: CaptureHudStyles;
    locked?: boolean;
    statusText?: string;
    fieldDate?: string;
    fieldNo?: string;
}

const props = withDefaults(defineProps<Props>(), {
    locked: false,
    statusText: "",
    fieldDate: "",
    fieldNo: "",
});

const emit = defineEmits<{
    shutter: [];
}>();

const pressed = ref(false);

function handleShutter(): void {
    pressed.value = true;
    setTimeout((): void => {
        pressed.value = false;
    }, 180);
    emit("shutter");
}
</script>

<template>
    <view class="hud" :style="props.styles.frame">
        <view class="bracket tl" :style="props.styles.bracketTl" />
        <view class="bracket tr" :style="props.styles.bracketTr" />
        <view class="bracket bl" :style="props.styles.bracketBl" />
        <view class="bracket br" :style="props.styles.bracketBr" />

        <view class="obs-kicker" :style="props.styles.obsKicker">OBSERVATION MODE</view>
        <view class="obs-name" :style="props.styles.obsName">BOTANICAL LENS v2.4</view>
        <view class="stamp-date align-right" :style="props.styles.stampDate">{{ props.fieldDate }}</view>
        <view class="stamp-no align-right" :style="props.styles.stampNo">{{ props.fieldNo }}</view>

        <view class="scope" :class="{ 'is-locked': props.locked }" :style="props.styles.scope">
            <view class="orbit" :style="props.styles.orbit">
                <view class="tick" :style="props.styles.tickN" />
                <view class="tick" :style="props.styles.tickE" />
                <view class="tick" :style="props.styles.tickS" />
                <view class="tick" :style="props.styles.tickW" />
            </view>
            <text class="deg n-label" :style="props.styles.labelN">0°</text>
            <text class="deg e-label" :style="props.styles.labelE">90°</text>
            <text class="deg s-label" :style="props.styles.labelS">180°</text>
            <text class="deg w-label" :style="props.styles.labelW">270°</text>
            <view class="lock-ring" :style="props.styles.lockRing" />
            <view class="cross-v" :style="props.styles.crossV" />
            <view class="cross-h" :style="props.styles.crossH" />
            <view class="cross-dot" :style="props.styles.crossDot" />
        </view>

        <view class="lock-status" :class="{ ready: props.locked }" :style="props.styles.status">
            <view class="status-dot" :style="props.styles.statusDot" />
            <text class="status-text" :style="props.styles.statusText">{{ props.statusText }}</text>
        </view>

        <view class="shutter" :class="{ pressed }" :style="props.styles.shutter" @tap="handleShutter">
            <text class="shutter-label" :style="props.styles.shutterLabel">收录</text>
        </view>
    </view>
</template>

<style lang="scss" scoped>
@import "../../styles/capture-hud.scss";

.shutter {
    cursor: pointer;
}
</style>
