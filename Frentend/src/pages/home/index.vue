<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref, watch } from "vue";
import CampGreenhouseEmpty from "@/components/camp/CampGreenhouseEmpty.vue";
import CampGreenhouseStage from "@/components/camp/CampGreenhouseStage.vue";
import CampPlayerHeader from "@/components/camp/CampPlayerHeader.vue";
import CampRecentRail from "@/components/camp/CampRecentRail.vue";
import CampWeatherStation from "@/components/camp/CampWeatherStation.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import LoadingState from "@/components/common/LoadingState.vue";
import AppTabBar from "@/components/layout/AppTabBar.vue";
import { useAuthState } from "@/composables/useAuthState";
import { useMainTabPage } from "@/composables/useMainTabPage";
import { usePageState } from "@/composables/usePageState";
import { AuthStatus } from "@/enums/auth-status";
import { CampWeather } from "@/enums/camp-weather";
import { MainTab } from "@/enums/main-tab";
import { createGuestCampOverview, resolveCampPlayerName, shouldPresentGuestCamp } from "@/pages/home/camp-guest";
import { getHomeOverview } from "@/services/home-service";
import type { HomeOverview } from "@/types/views";
import { toUserMessage } from "@/utils/business-error";
import { openCapture, openExplorer, openInstanceDetail, switchToCollection } from "@/utils/navigation";

useMainTabPage(MainTab.Home);

const { authStatus, bootstrapped, profile } = useAuthState();
const overview = ref<HomeOverview | null>(null);
const { isError, isSuccess, errorMessage, prepareLoad, isCurrentLoad, setSuccess, setError } = usePageState();
let overviewEpoch = 0;

const showPrivate = computed((): boolean => authStatus.value === AuthStatus.Authenticated);
const campPlayerName = computed((): string => resolveCampPlayerName(showPrivate.value, profile.value));
const featuredWeather = computed((): CampWeather => overview.value?.weatherStation.weather ?? CampWeather.Sunny);

onShow((): void => {
    void loadOverview();
});

watch([authStatus, bootstrapped], (): void => {
    void loadOverview();
});

async function loadOverview(): Promise<void> {
    overviewEpoch += 1;
    const epoch = overviewEpoch;
    if (shouldPresentGuestCamp(authStatus.value, bootstrapped.value)) {
        const ticket = prepareLoad();
        if (epoch !== overviewEpoch) {
            return;
        }
        overview.value = createGuestCampOverview();
        setSuccess(ticket);
        return;
    }
    if (!showPrivate.value) {
        overview.value = null;
        return;
    }
    const ticket = prepareLoad();
    try {
        const data = await getHomeOverview();
        if (!isCurrentLoad(ticket) || epoch !== overviewEpoch) {
            return;
        }
        overview.value = data;
        setSuccess(ticket);
    } catch (error) {
        if (epoch !== overviewEpoch) {
            return;
        }
        setError(toUserMessage(error, "营地加载失败"), ticket);
    }
}

function handleCapture(): void {
    openCapture();
}

function handleInstanceTap(instanceId: string): void {
    openInstanceDetail(instanceId);
}

function handleOpenProfile(): void {
    openExplorer();
}

function handleOpenCodex(): void {
    switchToCollection();
}
</script>

<template>
    <view class="page">
        <scroll-view scroll-y enable-flex class="board" :show-scrollbar="false">
            <view class="content">
                <LoadingState v-if="!overview && !isError" text="校准温室气象" />
                <ErrorState v-else-if="isError && !overview" :message="errorMessage" @action="loadOverview" />

                <template v-else-if="overview">
                    <CampPlayerHeader
                        :display-name="campPlayerName"
                        :discovered-species-count="overview.discoveredSpeciesCount"
                        :catalog-species-total="overview.catalogSpeciesTotal"
                        :show-codex="showPrivate"
                        @open-profile="handleOpenProfile" />

                    <view class="block weather">
                        <CampWeatherStation :station="overview.weatherStation" />
                    </view>

                    <view class="block stage">
                        <CampGreenhouseStage
                            v-if="overview.featuredPlant"
                            :plant="overview.featuredPlant"
                            :weather="featuredWeather"
                            @open-plant="handleInstanceTap" />
                        <CampGreenhouseEmpty v-else @explore="handleCapture" />
                    </view>

                    <view v-if="showPrivate" class="block rail">
                        <CampRecentRail
                            :items="overview.recentInstances"
                            @open-item="handleInstanceTap"
                            @open-codex="handleOpenCodex" />
                    </view>

                    <ErrorState v-if="isError" class="inline-error" :message="errorMessage" @action="loadOverview" />
                    <view v-else-if="isSuccess && showPrivate" class="footer-note">
                        <text class="footer-text">完整标本合集请前往图鉴翻阅</text>
                    </view>
                </template>
            </view>
        </scroll-view>
        <!-- #ifdef H5 -->
        <AppTabBar />
        <!-- #endif -->
    </view>
</template>

<style lang="scss" scoped>
.page {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #0d1c14;
    background-image:
        radial-gradient(rgba(212, 163, 89, 0.045) 1px, transparent 0),
        radial-gradient(ellipse at 80% 0%, rgba(212, 163, 89, 0.06), transparent 42%);
    background-size:
        24rpx 24rpx,
        100% 60%;
}

.board {
    flex: 1;
    min-height: 0;
    height: 100%;
}

.content {
    padding: 28rpx 28rpx 56rpx;
    box-sizing: border-box;
}

/* #ifdef H5 */
.content {
    padding-bottom: 260rpx;
}
/* #endif */

.block {
    margin-top: 24rpx;
}

.weather {
    margin-top: 22rpx;
}

.stage {
    margin-top: 28rpx;
}

.rail {
    margin-top: 36rpx;
}

.footer-note {
    margin-top: 28rpx;
    display: flex;
    justify-content: center;
}

.footer-text {
    font-size: 18rpx;
    letter-spacing: 2rpx;
    color: #5f7268;
}

.inline-error {
    margin-top: 24rpx;
}
</style>
