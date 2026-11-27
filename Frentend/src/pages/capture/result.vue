<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import AppButton from "@/components/common/AppButton.vue";
import CaptureJourney from "@/components/capture/CaptureJourney.vue";
import GameBadge from "@/components/game/GameBadge.vue";
import { ConfirmationType } from "@/enums/confirmation-type";
import { DiscoveryType } from "@/enums/discovery-type";
import { confirmCapture } from "@/services/capture-service";
import { useCaptureSessionStore } from "@/stores/capture-session-store";
import { toUserMessage } from "@/utils/business-error";
import { enterPrivatePage, openCandidates, openCaptureSuccess, showErrorToast, switchToCapture } from "@/utils/navigation";

const session = useCaptureSessionStore();
const primary = computed(() => session.task?.candidates[0] ?? null);
const submitting = ref(false);

onLoad((): void => {
    if (!enterPrivatePage()) {
        return;
    }
    if (!session.task || !primary.value) {
        switchToCapture();
    }
});

async function handleConfirm(): Promise<void> {
    if (!session.task || !primary.value || submitting.value) {
        return;
    }
    submitting.value = true;
    session.submitting = true;
    try {
        const result = await confirmCapture({
            recognitionTaskId: session.task.id,
            speciesId: primary.value.speciesId,
            confirmationType: ConfirmationType.AiPrimary,
            imageKey: session.imageKey,
            idempotencyKey: session.idempotencyKey,
        });
        session.setSuccess({
            instanceId: result.instance.id,
            speciesId: result.species.id,
            chineseName: result.species.chineseName,
            scientificName: result.species.scientificName,
            coverImageUrl: session.localFilePath,
            capturedAt: result.instance.capturedAt,
            discoveryType: result.isFirstDiscovery ? DiscoveryType.First : DiscoveryType.Repeat,
            collectionCode: result.instance.id.slice(-8).toUpperCase(),
        });
        openCaptureSuccess();
    } catch (error) {
        showErrorToast(toUserMessage(error, "收录失败，可安全重试"));
    } finally {
        submitting.value = false;
        session.submitting = false;
    }
}

function handleWrong(): void {
    openCandidates();
}

function handleRetake(): void {
    switchToCapture();
}

function handleCancel(): void {
    session.reset();
    switchToCapture();
}
</script>

<template>
    <view v-if="primary" class="page">
        <image class="photo" :src="session.localFilePath" mode="aspectFill" />
        <view class="panel">
            <CaptureJourney :current-step="3" />
            <GameBadge text="识别建议" tone="ghost" />
            <text class="name">{{ primary.chineseName }}</text>
            <text class="sci">{{ primary.scientificName }}</text>
            <text class="meta">{{ primary.family }} · {{ primary.genus }}</text>
            <text v-if="primary.confidence !== null" class="conf">
                参考匹配 {{ Math.round(primary.confidence * 100) }}%
            </text>
            <view class="gap" />
            <AppButton text="确认收录" :loading="submitting" @tap="handleConfirm" />
            <view class="gap" />
            <AppButton text="不是这种植物" type="secondary" @tap="handleWrong" />
            <view class="links">
                <text @tap="handleRetake">重新拍摄</text>
                <text @tap="handleCancel">放弃本次</text>
            </view>
        </view>
    </view>
</template>

<style lang="scss" scoped>
.page {
    min-height: 100vh;
    background: #07140f;
}

.photo {
    width: 100%;
    height: 420rpx;
    background: #000;
}

.panel {
    margin-top: -40rpx;
    padding: 36rpx 32rpx 48rpx;
    border-radius: 32rpx 32rpx 0 0;
    background: linear-gradient(180deg, #12281e, #07140f);
}

.name {
    display: block;
    margin-top: 16rpx;
    font-size: 48rpx;
    font-weight: 800;
}

.panel :deep(.journey) {
    margin-bottom: 24rpx;
}

.sci {
    display: block;
    margin-top: 8rpx;
    font-size: 26rpx;
    color: #8ea394;
    font-style: italic;
}

.meta,
.conf {
    display: block;
    margin-top: 10rpx;
    font-size: 24rpx;
    color: #8ea394;
}

.gap {
    height: 16rpx;
}

.links {
    margin-top: 28rpx;
    display: flex;
    justify-content: space-between;
    color: #8ea394;
    font-size: 26rpx;
}
</style>
