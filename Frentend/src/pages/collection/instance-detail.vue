<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import { ref } from "vue";
import AppButton from "@/components/common/AppButton.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import LoadingState from "@/components/common/LoadingState.vue";
import SpecimenSheetDeck from "@/components/plant/SpecimenSheetDeck.vue";
import { usePageState } from "@/composables/usePageState";
import { ConfirmationType } from "@/enums/confirmation-type";
import { getInstanceDetail } from "@/services/collection-service";
import type { InstanceCard, InstanceDetailView } from "@/types/views";
import { toUserMessage } from "@/utils/business-error";
import { formatDateTime } from "@/utils/date";
import { enterPrivatePage, openSpeciesDetail, showErrorToast } from "@/utils/navigation";

const detail = ref<InstanceDetailView | null>(null);
const deckItems = ref<InstanceCard[]>([]);
const currentInstanceId = ref("");
const switching = ref(false);
const { isLoading, isError, isSuccess, errorMessage, prepareLoad, isCurrentLoad, setSuccess, setError } =
    usePageState();

onLoad((query: Record<string, string | undefined> | undefined): void => {
    if (!enterPrivatePage()) {
        return;
    }
    const id = query?.id;
    if (!id) {
        setError("缺少个体 ID");
        return;
    }
    currentInstanceId.value = id;
    void loadDetail(id, true);
});

function toInstanceCard(data: InstanceDetailView): InstanceCard {
    return {
        instanceId: data.instanceId,
        speciesId: data.speciesId,
        chineseName: data.chineseName,
        scientificName: data.scientificName,
        family: data.family,
        coverImageUrl: data.coverImageUrl,
        capturedAt: data.capturedAt,
        discoveryType: data.discoveryType,
    };
}

async function loadDetail(instanceId: string, initializeDeck: boolean): Promise<void> {
    const ticket = initializeDeck ? prepareLoad() : 0;
    try {
        const data = await getInstanceDetail(instanceId);
        if (initializeDeck && !isCurrentLoad(ticket)) {
            return;
        }
        detail.value = data;
        currentInstanceId.value = data.instanceId;
        if (initializeDeck) {
            deckItems.value = [toInstanceCard(data), ...data.relatedInstances];
            setSuccess(ticket);
        }
    } catch (error) {
        const message = toUserMessage(error, "个体详情加载失败");
        if (initializeDeck) {
            setError(message, ticket);
            return;
        }
        showErrorToast(message);
    }
}

function confirmationText(type: ConfirmationType): string {
    if (type === ConfirmationType.AiPrimary) {
        return "确认了主要识别结果";
    }
    if (type === ConfirmationType.AiCandidate) {
        return "从候选物种中选择";
    }
    return "手动搜索确认";
}

function handleRetry(): void {
    if (currentInstanceId.value) {
        void loadDetail(currentInstanceId.value, true);
    }
}

function handleSpecies(): void {
    if (!detail.value) {
        return;
    }
    openSpeciesDetail(detail.value.speciesId);
}

async function handleDeckSelect(card: InstanceCard): Promise<void> {
    if (switching.value || card.instanceId === detail.value?.instanceId) {
        return;
    }
    switching.value = true;
    try {
        await loadDetail(card.instanceId, false);
    } finally {
        switching.value = false;
    }
}
</script>

<template>
    <view class="page">
        <LoadingState v-if="isLoading" />
        <ErrorState v-else-if="isError" :message="errorMessage" @action="handleRetry" />
        <view v-else-if="isSuccess && detail">
            <SpecimenSheetDeck :items="deckItems" :active-id="detail.instanceId" @select="handleDeckSelect" />
            <text v-if="switching" class="switching">正在翻阅另一份个体档案…</text>
            <view class="block">
                <text class="label">收录时间</text>
                <text class="value">{{ formatDateTime(detail.capturedAt) }}</text>
                <text class="label">确认方式</text>
                <text class="value">{{ confirmationText(detail.confirmationType) }}</text>
                <text v-if="detail.nickname" class="label">昵称</text>
                <text v-if="detail.nickname" class="value">{{ detail.nickname }}</text>
                <text v-if="detail.note" class="label">备注</text>
                <text v-if="detail.note" class="value">{{ detail.note }}</text>
            </view>
            <AppButton text="查看物种档案" type="secondary" @tap="handleSpecies" />
        </view>
    </view>
</template>

<style lang="scss" scoped>
.page {
    min-height: 100vh;
    padding: 24rpx 32rpx 48rpx;
    background-color: #0f1914;
    background-image: radial-gradient(rgba(212, 163, 89, 0.05) 1px, transparent 0);
    background-size: 24rpx 24rpx;
}

.block {
    margin: 28rpx 0;
    background: rgba(14, 34, 26, 0.94);
    border: 1rpx solid rgba(232, 197, 106, 0.25);
    border-radius: 24rpx;
    padding: 24rpx;
}

.label {
    display: block;
    font-size: 22rpx;
    color: #8ea394;
}

.value {
    display: block;
    margin: 8rpx 0 20rpx;
    font-size: 28rpx;
    color: #f4efe2;
}

.switching {
    display: block;
    margin-top: -8rpx;
    color: #8fa597;
    text-align: center;
    font-size: 20rpx;
}
</style>
