<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import AppButton from "@/components/common/AppButton.vue";
import { ConfirmationType } from "@/enums/confirmation-type";
import { DiscoveryType } from "@/enums/discovery-type";
import { confirmCapture } from "@/services/capture-service";
import { useCaptureSessionStore } from "@/stores/capture-session-store";
import type { RecognitionCandidate } from "@/types/recognition";
import { toUserMessage } from "@/utils/business-error";
import { enterPrivatePage, openCaptureSuccess, showErrorToast, switchToCapture } from "@/utils/navigation";

const session = useCaptureSessionStore();
const selectedId = ref(session.selectedSpeciesId);

onShow((): void => {
    enterPrivatePage();
});
const submitting = ref(false);
const candidates = computed((): RecognitionCandidate[] => session.task?.candidates ?? []);

function handleSelect(candidate: RecognitionCandidate): void {
    selectedId.value = candidate.speciesId;
    session.selectCandidate(candidate, ConfirmationType.AiCandidate);
}

async function handleConfirm(): Promise<void> {
    const candidate = candidates.value.find(item => item.speciesId === selectedId.value);
    if (!session.task || !candidate || submitting.value) {
        return;
    }
    submitting.value = true;
    try {
        const result = await confirmCapture({
            recognitionTaskId: session.task.id,
            speciesId: candidate.speciesId,
            confirmationType: ConfirmationType.AiCandidate,
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
    }
}

function handleCancel(): void {
    session.reset();
    switchToCapture();
}
</script>

<template>
    <view class="page">
        <text class="lead">从候选名册中选择更接近的物种。选择后仍需确认才会创建收藏。</text>
        <view
            v-for="item in candidates"
            :key="item.speciesId"
            class="item"
            :class="{ active: item.speciesId === selectedId }"
            @tap="handleSelect(item)">
            <text class="name">{{ item.chineseName }}</text>
            <text class="sci">{{ item.scientificName }}</text>
            <text class="meta">{{ item.family }} · {{ item.genus }}</text>
        </view>
        <view v-if="candidates.length === 0" class="empty">没有可选择的候选物种</view>
        <view class="footer">
            <AppButton text="确认选择并收录" :disabled="!selectedId" :loading="submitting" @tap="handleConfirm" />
            <view class="gap" />
            <AppButton text="放弃本次收录" type="ghost" @tap="handleCancel" />
        </view>
    </view>
</template>

<style lang="scss" scoped>
.page {
    min-height: 100vh;
    padding: 24rpx 32rpx 48rpx;
    background: #07140f;
}

.lead {
    display: block;
    margin-bottom: 24rpx;
    color: #8ea394;
    font-size: 26rpx;
    line-height: 1.6;
}

.item {
    background: rgba(14, 34, 26, 0.94);
    border-radius: 20rpx;
    padding: 24rpx;
    margin-bottom: 16rpx;
    border: 2rpx solid rgba(232, 197, 106, 0.18);
}

.active {
    border-color: #e8c56a;
    background: rgba(232, 197, 106, 0.12);
}

.name {
    display: block;
    font-size: 32rpx;
    font-weight: 700;
}

.sci,
.meta {
    display: block;
    margin-top: 6rpx;
    font-size: 24rpx;
    color: #8ea394;
}

.empty {
    padding: 40rpx 0;
    color: #8ea394;
}

.footer {
    margin-top: 24rpx;
}

.gap {
    height: 16rpx;
}
</style>
