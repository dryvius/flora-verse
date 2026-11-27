<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { ref } from "vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import LoadingState from "@/components/common/LoadingState.vue";
import AppTabBar from "@/components/layout/AppTabBar.vue";
import CodexProgress from "@/components/layout/CodexProgress.vue";
import CodexTabs from "@/components/layout/CodexTabs.vue";
import PlantJournalCover from "@/components/plant/PlantJournalCover.vue";
import { useMainTabPage } from "@/composables/useMainTabPage";
import { usePageState } from "@/composables/usePageState";
import { MainTab } from "@/enums/main-tab";
import {
    getCodexProgress,
    groupInstancesBySpecies,
    listDiscoveredSpecies,
    listInstances,
} from "@/services/collection-service";
import type { CodexProgress as CodexProgressView, DiscoveredSpeciesView, InstanceCollectionGroup } from "@/types/views";
import { toUserMessage } from "@/utils/business-error";
import { enterPrivatePage, openCapture, openInstanceDetail, openSpeciesDetail } from "@/utils/navigation";

useMainTabPage(MainTab.Collection);

type CollectionTab = "species" | "instances";

const CODEX_TABS: { id: CollectionTab; label: string }[] = [
    { id: "species", label: "物种图鉴" },
    { id: "instances", label: "个体收藏" },
];

const tab = ref<CollectionTab>("species");
const species = ref<DiscoveredSpeciesView[]>([]);
const instanceGroups = ref<InstanceCollectionGroup[]>([]);
const progress = ref<CodexProgressView>({
    unlockedCount: 0,
    catalogCount: 0,
});
const { isLoading, isError, isEmpty, isSuccess, errorMessage, prepareLoad, isCurrentLoad, setSuccess, setEmpty, setError } =
    usePageState();

onShow((): void => {
    if (!enterPrivatePage()) {
        return;
    }
    void loadTab(tab.value);
});

async function loadTab(nextTab: CollectionTab): Promise<void> {
    const ticket = prepareLoad();
    try {
        const nextProgress = await getCodexProgress();
        if (nextTab === "species") {
            const result = await listDiscoveredSpecies();
            if (!isCurrentLoad(ticket)) {
                return;
            }
            progress.value = nextProgress;
            species.value = result.items;
            tab.value = nextTab;
            if (result.items.length === 0) {
                setEmpty(ticket);
                return;
            }
        } else {
            const result = await listInstances({ pageSize: 50 });
            if (!isCurrentLoad(ticket)) {
                return;
            }
            progress.value = nextProgress;
            instanceGroups.value = groupInstancesBySpecies(result.items);
            tab.value = nextTab;
            if (result.items.length === 0) {
                setEmpty(ticket);
                return;
            }
        }
        setSuccess(ticket);
    } catch (error) {
        setError(toUserMessage(error, "植物谱加载失败"), ticket);
    }
}

function isCollectionTab(value: string): value is CollectionTab {
    return value === "species" || value === "instances";
}

function handleTab(next: string): void {
    if (!isCollectionTab(next) || tab.value === next) {
        return;
    }
    void loadTab(next);
}

function reloadCurrentTab(): void {
    void loadTab(tab.value);
}

function handleCapture(): void {
    openCapture();
}

function handleSpeciesTap(speciesId: string): void {
    openSpeciesDetail(speciesId);
}

function handleInstanceTap(instanceId: string): void {
    openInstanceDetail(instanceId);
}
</script>

<template>
    <view class="page">
        <view class="codex-fixed">
            <view class="codex-hero">
                <view class="hero-emblem">
                    <text class="emblem-leaf">❧</text>
                </view>
                <view class="hero-copy">
                    <text class="hero-kicker">EXPLORER'S CODEX</text>
                    <text class="hero-title">远征图鉴</text>
                    <text class="hero-desc">每一次发现，都会点亮一页自然档案</text>
                </view>
                <view class="hero-score fv-stack-metric">
                    <text class="fv-stack-metric__value score-value">{{ progress.unlockedCount }}</text>
                    <text class="fv-stack-metric__label score-label">已发现</text>
                </view>
            </view>
            <CodexTabs :tabs="CODEX_TABS" :model-value="tab" @update:model-value="handleTab" />
            <CodexProgress :unlocked-count="progress.unlockedCount" :catalog-count="progress.catalogCount" />
        </view>
        <scroll-view scroll-y enable-flex class="collection-scroll" :show-scrollbar="false">
            <LoadingState v-if="isLoading" />
                <ErrorState v-else-if="isError" :message="errorMessage" @action="reloadCurrentTab" />
            <EmptyState
                v-else-if="isEmpty"
                title="图鉴尚未点亮"
                description="成功收录后，物种进入图鉴，每一次收录都会留下独立个体。"
                action-text="去收录"
                @action="handleCapture" />
            <view v-else-if="isSuccess && tab === 'species'" class="grid">
                <view v-for="card in species" :key="card.speciesId" class="cell">
                    <PlantJournalCover
                        :item-id="card.speciesId"
                        :title="card.chineseName"
                        :latin-name="card.scientificName"
                        :image-url="card.coverImageUrl"
                        :family="card.family"
                        :captured-at="card.firstDiscoveredAt"
                        @tap="handleSpeciesTap" />
                </view>
            </view>
            <view v-else-if="isSuccess" class="grid">
                <view v-for="group in instanceGroups" :key="group.speciesId" class="cell">
                    <PlantJournalCover
                        :item-id="group.latestInstance.instanceId"
                        :title="group.chineseName"
                        :latin-name="group.scientificName"
                        :image-url="group.latestInstance.coverImageUrl"
                        :family="group.family"
                        :captured-at="group.latestInstance.capturedAt"
                        :count="group.instanceCount"
                        @tap="handleInstanceTap" />
                </view>
            </view>
        </scroll-view>
        <!-- #ifdef H5 -->
        <AppTabBar />
        <!-- #endif -->
    </view>
</template>

<style lang="scss" scoped>
.page {
    height: 100vh;
    padding: 16rpx 32rpx 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
    background-color: #0f1914;
    background-image:
        radial-gradient(circle at 85% 6%, rgba(212, 163, 89, 0.12), transparent 24%),
        radial-gradient(rgba(212, 163, 89, 0.05) 1px, transparent 0);
    background-size:
        100% 100%,
        24rpx 24rpx;
}

.codex-fixed {
    flex-shrink: 0;
}

.codex-hero {
    position: relative;
    margin: 4rpx 4rpx 18rpx;
    padding: 22rpx 20rpx;
    display: flex;
    align-items: center;
    overflow: hidden;
    background: linear-gradient(118deg, #263b2e, #14261d 70%);
    border: 2rpx solid rgba(212, 163, 89, 0.44);
    border-radius: 28rpx 10rpx 28rpx 10rpx;
    box-shadow: 0 10rpx 24rpx rgba(0, 0, 0, 0.3);
}

.codex-hero::before {
    content: "";
    position: absolute;
    left: 110rpx;
    right: 72rpx;
    bottom: 14rpx;
    height: 1rpx;
    background: linear-gradient(90deg, rgba(212, 163, 89, 0.34), transparent);
}

.hero-emblem {
    width: 88rpx;
    height: 88rpx;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50% 50% 46% 54%;
    color: #203126;
    background: radial-gradient(circle at 35% 30%, #f0d596, #b68238 70%);
    border: 4rpx double #edd395;
    box-shadow: 0 5rpx 12rpx rgba(0, 0, 0, 0.3);
    transform: rotate(-8deg);
}

.emblem-leaf {
    font-size: 50rpx;
    transform: rotate(24deg);
}

.hero-copy {
    flex: 1;
    min-width: 0;
    margin-left: 18rpx;
}

.hero-kicker,
.hero-title,
.hero-desc {
    display: block;
}

.hero-kicker {
    color: #b99a5a;
    font-size: 15rpx;
    letter-spacing: 3rpx;
}

.hero-title {
    margin-top: 3rpx;
    color: #f0e8d6;
    font-size: 34rpx;
    font-weight: 700;
    letter-spacing: 4rpx;
}

.hero-desc {
    margin-top: 3rpx;
    color: #82988b;
    font-size: 17rpx;
}

.hero-score {
    flex-shrink: 0;
    margin-left: 12rpx;
    transform: rotate(3deg);
}

.score-value {
    color: #e4bd68;
    font-size: 46rpx;
    line-height: 46rpx;
    height: 46rpx;
}

.score-label {
    color: #8ba895;
    font-size: 16rpx;
    line-height: 16rpx;
    height: 16rpx;
}

.collection-scroll {
    flex: 1;
    min-height: 0;
    height: 100%;
    box-sizing: border-box;
}

.grid {
    display: flex;
    flex-wrap: wrap;
    margin: 16rpx -10rpx 0;
    padding-bottom: 32rpx;
}

/* #ifdef H5 */
.grid {
    padding-bottom: 260rpx;
}
/* #endif */

.cell {
    width: 50%;
    padding: 10rpx;
    flex-shrink: 0;
    box-sizing: border-box;
    overflow: visible;
}
</style>
