<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref, watch } from "vue";
import ErrorState from "@/components/common/ErrorState.vue";
import LoadingState from "@/components/common/LoadingState.vue";
import AppTabBar from "@/components/layout/AppTabBar.vue";
import { useAuthState } from "@/composables/useAuthState";
import { useMainTabPage } from "@/composables/useMainTabPage";
import { usePageState } from "@/composables/usePageState";
import { MainTab } from "@/enums/main-tab";
import {
    resolveExplorerRank,
    resolveExplorerRankHint,
    resolveExplorerRankProgress,
} from "@/constants/explorer-rank";
import {
    ME_IDENTITY_COPY,
    MeIdentityView,
    avatarGlyph,
    presentMeIdentity,
    resolveAuthenticatedDisplayName,
    retryMeIdentity,
    shouldLoadMeStats,
} from "@/pages/me/me-identity";
import type { MeIdentityPresentation } from "@/pages/me/me-identity";
import { getUserStats } from "@/services/user-service";
import { useUserStore } from "@/stores/user-store";
import type { UserCollectionStats } from "@/types/user";
import { toUserMessage } from "@/utils/business-error";
import { openLogin, openSettings } from "@/utils/navigation";

useMainTabPage(MainTab.Me);

const { authStatus, bootstrapped, profile } = useAuthState();
const retrying = ref(false);
const retryMessage = ref("");
const stats = ref<UserCollectionStats | null>(null);
const { isLoading, isError, errorMessage, prepareLoad, isCurrentLoad, setSuccess, setError } = usePageState();

const presentation = computed((): MeIdentityPresentation =>
    presentMeIdentity({
        authStatus: authStatus.value,
        bootstrapped: bootstrapped.value,
        retrying: retrying.value,
    }),
);
const isIdentityLoading = computed((): boolean => presentation.value.view === MeIdentityView.Loading);
const isUnavailable = computed((): boolean => presentation.value.showRetry);
const showLogin = computed((): boolean => presentation.value.showLogin);
const showAuthenticated = computed((): boolean => presentation.value.showAuthenticatedName);
const displayName = computed((): string => resolveAuthenticatedDisplayName(profile.value));
const identityName = computed((): string => (showLogin.value ? ME_IDENTITY_COPY.guestTitle : displayName.value));
const speciesCount = computed((): number => stats.value?.discoveredSpeciesCount ?? 0);
const explorerRank = computed((): string => resolveExplorerRank(speciesCount.value));
const rankProgress = computed((): number => resolveExplorerRankProgress(speciesCount.value));
const rankHint = computed((): string => resolveExplorerRankHint(speciesCount.value));
const identityRole = computed((): string => {
    if (showLogin.value) {
        return ME_IDENTITY_COPY.guestHint;
    }
    if (!stats.value) {
        return "";
    }
    return explorerRank.value;
});
const avatarText = computed((): string => avatarGlyph(identityName.value));
const unavailableDetail = computed((): string =>
    retryMessage.value.length > 0 ? retryMessage.value : ME_IDENTITY_COPY.unavailableHint,
);
const isStatsLoading = computed((): boolean => showAuthenticated.value && isLoading.value && stats.value === null);
const showRank = computed((): boolean => showAuthenticated.value && stats.value !== null);
let statsEpoch = 0;

const identityLoadingText = ME_IDENTITY_COPY.loadingText;
const unavailableTitle = ME_IDENTITY_COPY.unavailableTitle;
const retryActionText = ME_IDENTITY_COPY.retryAction;
const loginActionText = ME_IDENTITY_COPY.loginAction;
const statsLoadingText = "整理收藏记录";

onShow((): void => {
    syncStats();
});

watch(authStatus, (): void => {
    syncStats();
});

function syncStats(): void {
    statsEpoch += 1;
    if (!shouldLoadMeStats(authStatus.value)) {
        stats.value = null;
        return;
    }
    void loadStats(statsEpoch);
}

async function loadStats(epoch: number = statsEpoch): Promise<void> {
    const ticket = prepareLoad();
    try {
        const nextStats = await getUserStats();
        if (!isCurrentLoad(ticket) || epoch !== statsEpoch || !shouldLoadMeStats(authStatus.value)) {
            return;
        }
        stats.value = nextStats;
        setSuccess(ticket);
    } catch (error) {
        if (epoch !== statsEpoch || !shouldLoadMeStats(authStatus.value)) {
            return;
        }
        setError(toUserMessage(error, "收藏统计加载失败"), ticket);
    }
}

function handleLogin(): void {
    openLogin();
}

async function handleRetry(): Promise<void> {
    await retryMeIdentity({
        isRetrying: (): boolean => retrying.value,
        setRetrying: (value: boolean): void => {
            retrying.value = value;
        },
        setMessage: (value: string): void => {
            retryMessage.value = value;
        },
        bootstrap: (): Promise<void> => useUserStore().bootstrap(),
    });
}
</script>

<template>
    <view class="page">
        <view class="content">
            <LoadingState v-if="isIdentityLoading" :text="identityLoadingText" />

            <view v-else-if="isUnavailable" class="explorer">
                <text class="explorer-ribbon">FIELD EXPLORER</text>
                <view class="identity">
                    <view class="avatar-wrap">
                        <view class="avatar">?</view>
                    </view>
                    <view class="who">
                        <text class="hello">{{ unavailableTitle }}</text>
                        <text class="role">{{ unavailableDetail }}</text>
                    </view>
                </view>
                <view class="login-row" @tap="handleRetry">
                    <text>{{ retryActionText }}</text>
                    <text class="arrow">›</text>
                </view>
            </view>

            <view v-else class="explorer">
                <text class="explorer-ribbon">FIELD EXPLORER</text>
                <view class="identity">
                    <view class="avatar-wrap">
                        <view class="avatar">{{ avatarText }}</view>
                        <text v-if="showRank" class="level">LV.{{ speciesCount }}</text>
                    </view>
                    <view class="who">
                        <text class="hello">{{ identityName }}</text>
                        <text v-if="identityRole" class="role">{{ identityRole }}</text>
                        <template v-if="showRank">
                            <view class="rank-track">
                                <view class="rank-progress" :style="{ width: `${rankProgress}%` }" />
                            </view>
                            <text class="rank-hint">{{ rankHint }}</text>
                        </template>
                    </view>
                </view>
                <view v-if="showLogin" class="login-row" @tap="handleLogin">
                    <text>{{ loginActionText }}</text>
                    <text class="arrow">›</text>
                </view>
                <view v-if="showAuthenticated && stats" class="meters">
                    <view class="meter fv-stack-metric">
                        <text class="fv-stack-metric__value">{{ stats.discoveredSpeciesCount }}</text>
                        <text class="fv-stack-metric__label">物种</text>
                    </view>
                    <view class="meter-line" />
                    <view class="meter fv-stack-metric">
                        <text class="fv-stack-metric__value">{{ stats.instanceCount }}</text>
                        <text class="fv-stack-metric__label">个体</text>
                    </view>
                    <view class="meter-line" />
                    <view class="meter fv-stack-metric">
                        <text class="fv-stack-metric__value">{{ stats.totalCombatPower }}</text>
                        <text class="fv-stack-metric__label">战力</text>
                    </view>
                </view>
            </view>

            <LoadingState v-if="isStatsLoading" :text="statsLoadingText" />
            <ErrorState v-else-if="showAuthenticated && isError" :message="errorMessage" @action="syncStats" />
            <view v-else-if="showAuthenticated && stats" class="panel">
                <view class="panel-row">
                    <text class="panel-label">成功收录</text>
                    <view class="fv-metric">
                        <text class="fv-metric__value panel-metric">{{ stats.successfulCaptureCount }}</text>
                        <text class="fv-metric__unit">次</text>
                    </view>
                </view>
                <view class="panel-row">
                    <text class="panel-label">综合战斗力</text>
                    <view class="fv-metric">
                        <text class="fv-metric__value panel-metric">{{ stats.totalCombatPower }}</text>
                        <text class="fv-metric__unit">战力</text>
                    </view>
                </view>
            </view>

            <view v-if="!isIdentityLoading" class="cell" @tap="openSettings">
                <text>设置与隐私</text>
                <text class="arrow">›</text>
            </view>
        </view>

        <!-- #ifdef H5 -->
        <AppTabBar />
        <!-- #endif -->
    </view>
</template>

<style lang="scss" scoped>
.page {
    min-height: 100vh;
    padding: 24rpx 32rpx 180rpx;
    background-color: #0f1914;
    background-image: radial-gradient(rgba(212, 163, 89, 0.05) 1px, transparent 0);
    background-size: 24rpx 24rpx;
}

.content {
    display: flex;
    flex-direction: column;
}

.explorer {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
    padding: 34rpx 22rpx 22rpx;
    overflow: hidden;
    background:
        radial-gradient(circle at 8% 65%, rgba(212, 163, 89, 0.18), transparent 30%),
        linear-gradient(115deg, #1d3428, #102219 72%);
    border: 2rpx solid rgba(212, 163, 89, 0.42);
    border-radius: 8rpx 28rpx 8rpx 20rpx;
    box-shadow:
        0 10rpx 24rpx rgba(0, 0, 0, 0.4),
        inset 0 1rpx 0 rgba(255, 255, 255, 0.08);
}

.explorer::after {
    content: "";
    position: absolute;
    right: -42rpx;
    bottom: -76rpx;
    width: 210rpx;
    height: 210rpx;
    border: 1rpx dashed rgba(212, 163, 89, 0.16);
    border-radius: 48%;
    transform: rotate(18deg);
}

.explorer-ribbon {
    position: absolute;
    top: 8rpx;
    left: 128rpx;
    color: rgba(212, 163, 89, 0.72);
    font-size: 13rpx;
    letter-spacing: 4rpx;
}

.identity {
    display: flex;
    align-items: center;
    min-width: 0;
}

.login-row {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8rpx;
    padding: 20rpx 4rpx 2rpx;
    color: #f4efe2;
    font-size: 28rpx;
    border-top: 1rpx solid rgba(212, 163, 89, 0.22);
}

.avatar {
    width: 88rpx;
    height: 88rpx;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #f4efe6, #d4a359);
    color: #2b2823;
    border: 3rpx solid #d4a359;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36rpx;
    font-weight: 800;
    box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.28);
}

.avatar-wrap {
    position: relative;
    width: 94rpx;
    margin-right: 20rpx;
    flex-shrink: 0;
}

.level {
    position: absolute;
    left: 4rpx;
    right: 4rpx;
    bottom: -9rpx;
    padding: 2rpx 0;
    color: #f2d58d;
    text-align: center;
    font-size: 14rpx;
    line-height: 18rpx;
    font-weight: 700;
    border: 1rpx solid #9b7034;
    background: #172a20;
    border-radius: 8rpx;
    font-variant-numeric: tabular-nums;
}

.who {
    min-width: 0;
    flex: 1;
}

.hello {
    display: block;
    font-size: 34rpx;
    font-weight: 700;
    color: #ece9df;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.role {
    display: block;
    margin-top: 4rpx;
    color: #8eb09a;
    font-size: 20rpx;
}

.rank-track {
    width: 220rpx;
    height: 7rpx;
    margin-top: 9rpx;
    overflow: hidden;
    border-radius: 8rpx;
    background: rgba(4, 13, 9, 0.72);
    border: 1rpx solid rgba(212, 163, 89, 0.22);
}

.rank-progress {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #80602c, #e0b75d);
    box-shadow: 0 0 9rpx rgba(224, 183, 93, 0.4);
}

.rank-hint {
    display: block;
    margin-top: 5rpx;
    color: #667c70;
    font-size: 14rpx;
}

.meters {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding-top: 8rpx;
}

.meter {
    min-width: 72rpx;
}

.meter-line {
    width: 1rpx;
    height: 40rpx;
    background: rgba(212, 163, 89, 0.28);
}

.panel {
    margin-top: 24rpx;
    padding: 8rpx 0;
    border-radius: 16rpx;
    border: 1rpx solid rgba(212, 163, 89, 0.22);
    background: rgba(14, 34, 26, 0.94);
}

.panel-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 28rpx;
}

.panel-row + .panel-row {
    border-top: 1rpx solid rgba(212, 163, 89, 0.14);
}

.panel-label {
    font-size: 26rpx;
    line-height: 40rpx;
    color: #9aa89f;
}

.panel-metric {
    font-size: 34rpx;
    line-height: 34rpx;
    height: 34rpx;
}

.cell {
    margin-top: 24rpx;
    background: rgba(14, 34, 26, 0.94);
    border: 1rpx solid rgba(232, 197, 106, 0.25);
    border-radius: 16rpx;
    padding: 32rpx;
    display: flex;
    justify-content: space-between;
    font-size: 28rpx;
    color: #f4efe2;
}

.arrow {
    color: #e8c56a;
}
</style>
