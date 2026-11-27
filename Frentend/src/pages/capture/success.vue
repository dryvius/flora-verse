<script setup lang="ts">
import { onLoad } from "@dcloudio/uni-app";
import AppButton from "@/components/common/AppButton.vue";
import CaptureJourney from "@/components/capture/CaptureJourney.vue";
import PlantSpecimenSheet from "@/components/plant/PlantSpecimenSheet.vue";
import { DiscoveryType } from "@/enums/discovery-type";
import { useCaptureSessionStore } from "@/stores/capture-session-store";
import { enterPrivatePage, openInstanceDetail, switchToCapture, switchToCollection } from "@/utils/navigation";

const session = useCaptureSessionStore();

onLoad((): void => {
    if (!enterPrivatePage()) {
        return;
    }
    if (!session.successView) {
        switchToCollection();
    }
});

function handleDetail(): void {
    if (!session.successView) {
        return;
    }
    openInstanceDetail(session.successView.instanceId);
}

function handleContinue(): void {
    session.reset();
    switchToCapture();
}

function handleCollection(): void {
    session.reset();
    switchToCollection();
}
</script>

<template>
    <view v-if="session.successView" class="page">
        <CaptureJourney :current-step="4" />
        <text class="kicker">档案解封</text>
        <text class="title">收入图鉴</text>
        <PlantSpecimenSheet
            :item-id="session.successView.instanceId"
            :title="session.successView.chineseName"
            :latin-name="session.successView.scientificName"
            :image-url="session.successView.coverImageUrl"
            :captured-at="session.successView.capturedAt"
            :note="`编号 ${session.successView.collectionCode}`"
            :is-new="session.successView.discoveryType === DiscoveryType.First" />
        <view class="actions">
            <AppButton text="查看档案" @tap="handleDetail" />
            <view class="gap" />
            <AppButton text="继续收录" type="secondary" @tap="handleContinue" />
            <view class="gap" />
            <AppButton text="返回图鉴" type="ghost" @tap="handleCollection" />
        </view>
    </view>
</template>

<style lang="scss" scoped>
.page {
    min-height: 100vh;
    padding: 36rpx 32rpx 64rpx;
    background-color: #0f1914;
    background-image: radial-gradient(rgba(212, 163, 89, 0.05) 1px, transparent 0);
    background-size: 24rpx 24rpx;
}

.kicker {
    display: block;
    margin-top: 28rpx;
    font-size: 20rpx;
    letter-spacing: 8rpx;
    color: #d4a359;
}

.title {
    display: block;
    margin: 8rpx 0 24rpx;
    font-size: 48rpx;
    font-weight: 800;
    color: #ece9df;
}

.actions {
    margin-top: 32rpx;
}

.gap {
    height: 16rpx;
}
</style>
