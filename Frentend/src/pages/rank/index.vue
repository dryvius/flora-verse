<script setup lang="ts">
import { onShow } from "@dcloudio/uni-app";
import { computed, ref } from "vue";
import EmptyState from "@/components/common/EmptyState.vue";
import ErrorState from "@/components/common/ErrorState.vue";
import LoadingState from "@/components/common/LoadingState.vue";
import AppTabBar from "@/components/layout/AppTabBar.vue";
import { useMainTabPage } from "@/composables/useMainTabPage";
import { usePageState } from "@/composables/usePageState";
import { MainTab } from "@/enums/main-tab";
import { RankMetric } from "@/enums/rank-metric";
import { getFriendRanking } from "@/services/rank-service";
import type { FriendRankBoard, FriendRankEntry } from "@/types/rank";
import { toUserMessage } from "@/utils/business-error";
import { enterPrivatePage } from "@/utils/navigation";

useMainTabPage(MainTab.Rank);

const METRIC_OPTIONS: { id: RankMetric; label: string }[] = [
    { id: RankMetric.SpeciesCount, label: "物种数量" },
    { id: RankMetric.CombatPower, label: "综合战力" },
];

const metric = ref<RankMetric>(RankMetric.SpeciesCount);
const metricMenuOpen = ref(false);
const board = ref<FriendRankBoard | null>(null);
const {
    isLoading,
    isError,
    isEmpty,
    isSuccess,
    errorMessage,
    prepareLoad,
    isCurrentLoad,
    setSuccess,
    setEmpty,
    setError,
} = usePageState();

const metricLabel = computed((): string => {
    return METRIC_OPTIONS.find(item => item.id === metric.value)?.label ?? "物种数量";
});

const selfRankText = computed((): string => {
    if (!board.value?.selfRank) {
        return "尚未进入好友榜";
    }
    return `你当前位列第 ${board.value.selfRank} 名`;
});

const podiumSecond = computed((): FriendRankEntry | null => {
    return board.value?.entries.find(item => item.rank === 2) ?? null;
});

const podiumFirst = computed((): FriendRankEntry | null => {
    return board.value?.entries.find(item => item.rank === 1) ?? null;
});

const podiumThird = computed((): FriendRankEntry | null => {
    return board.value?.entries.find(item => item.rank === 3) ?? null;
});

const restEntries = computed((): FriendRankEntry[] => {
    return (board.value?.entries ?? []).filter(item => item.rank > 3);
});

onShow((): void => {
    if (!enterPrivatePage()) {
        return;
    }
    metricMenuOpen.value = false;
    void loadRanking(metric.value);
});

async function loadRanking(nextMetric: RankMetric): Promise<void> {
    const ticket = prepareLoad();
    try {
        const nextBoard = await getFriendRanking(nextMetric);
        if (!isCurrentLoad(ticket)) {
            return;
        }
        board.value = nextBoard;
        if (nextBoard.entries.length === 0) {
            setEmpty(ticket);
            return;
        }
        setSuccess(ticket);
    } catch (error) {
        setError(toUserMessage(error, "排行榜加载失败"), ticket);
    }
}

function toggleMetricMenu(): void {
    metricMenuOpen.value = !metricMenuOpen.value;
}

function closeMetricMenu(): void {
    metricMenuOpen.value = false;
}

function handleMetricSelect(nextMetric: RankMetric): void {
    metricMenuOpen.value = false;
    if (metric.value === nextMetric) {
        return;
    }
    metric.value = nextMetric;
    void loadRanking(nextMetric);
}

function formatScore(entry: FriendRankEntry): string {
    if (metric.value === RankMetric.SpeciesCount) {
        return String(entry.speciesCount);
    }
    return String(entry.combatPower);
}

function scoreUnit(): string {
    return metric.value === RankMetric.SpeciesCount ? "种" : "战力";
}

function podiumEnLabel(): string {
    return metric.value === RankMetric.SpeciesCount ? "Collected" : "Power";
}

function podiumEnSuffix(): string {
    return metric.value === RankMetric.SpeciesCount ? "Species" : "";
}

function podiumZhLabel(): string {
    return metric.value === RankMetric.SpeciesCount ? "已收集" : "综合战力";
}

function podiumZhSuffix(): string {
    return metric.value === RankMetric.SpeciesCount ? "种" : "";
}

function medalMark(rank: number): string {
    if (rank === 1) {
        return "I";
    }
    if (rank === 2) {
        return "II";
    }
    if (rank === 3) {
        return "III";
    }
    return `${rank}`;
}

function emblemLeaf(rank: number): string {
    if (rank === 1) {
        return "❧";
    }
    if (rank === 2) {
        return "☘";
    }
    return "❁";
}
</script>

<template>
    <view class="page">
        <view class="vault-glow" />
        <view class="mote mote-a" />
        <view class="mote mote-b" />
        <view class="mote mote-c" />
        <view class="mote mote-d" />
        <view class="mote mote-e" />
        <view v-if="metricMenuOpen" class="menu-mask" @tap="closeMetricMenu" />

        <view class="header">
            <text class="kicker">FRIEND LEADERBOARD</text>
            <view class="brand">
                <view class="fern">
                    <view class="fern-stem" />
                    <view class="fern-blade b1" />
                    <view class="fern-blade b2" />
                    <view class="fern-blade b3" />
                </view>
                <text class="title">好友排行</text>
                <view class="fern is-mirror">
                    <view class="fern-stem" />
                    <view class="fern-blade b1" />
                    <view class="fern-blade b2" />
                    <view class="fern-blade b3" />
                </view>
            </view>
            <text class="subtitle">与好友比拼收录广度与植物战力</text>

            <view class="toolbar">
                <text class="self-hint">{{ selfRankText }}</text>
                <view class="metric-wrap">
                    <view class="metric-trigger" @tap.stop="toggleMetricMenu">
                        <text class="metric-label">{{ metricLabel }}</text>
                        <view class="metric-caret" :class="{ open: metricMenuOpen }" />
                    </view>
                    <view v-if="metricMenuOpen" class="metric-menu">
                        <view
                            v-for="item in METRIC_OPTIONS"
                            :key="item.id"
                            class="metric-option"
                            :class="{ active: metric === item.id }"
                            @tap.stop="handleMetricSelect(item.id)">
                            <text>{{ item.label }}</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <LoadingState v-if="isLoading" text="同步好友战报" />
        <ErrorState v-else-if="isError" :message="errorMessage" @action="loadRanking(metric)" />
        <EmptyState v-else-if="isEmpty" title="暂无排行数据" description="先收录一些植物，再邀请好友一起探索。" />
        <view v-else-if="isSuccess" class="board">
            <view class="podium">
                <view class="chart" />
                <view v-if="podiumSecond" class="pillar place-2" :class="{ self: podiumSecond.isSelf }">
                    <view class="emblem">
                        <view class="speck" />
                        <view class="patina" />
                        <view class="wreath outer" />
                        <view class="wreath inner" />
                        <text class="leaf">{{ emblemLeaf(2) }}</text>
                        <view class="shield">
                            <text>{{ medalMark(2) }}</text>
                        </view>
                    </view>
                    <text class="pillar-name">{{ podiumSecond.displayName }}</text>
                    <text v-if="podiumSecond.isSelf" class="you">我</text>
                    <view class="divider">
                        <view class="divider-line" />
                        <view class="divider-dot" />
                        <view class="divider-line" />
                    </view>
                    <view class="stat-line en">
                        <text class="stat-label">{{ podiumEnLabel() }}</text>
                        <text class="stat-num">{{ formatScore(podiumSecond) }}</text>
                        <text v-if="podiumEnSuffix()" class="stat-label">{{ podiumEnSuffix() }}</text>
                    </view>
                    <view class="stat-line zh">
                        <text class="stat-label">{{ podiumZhLabel() }}</text>
                        <text class="stat-num">{{ formatScore(podiumSecond) }}</text>
                        <text v-if="podiumZhSuffix()" class="stat-label">{{ podiumZhSuffix() }}</text>
                    </view>
                </view>

                <view v-if="podiumFirst" class="pillar place-1" :class="{ self: podiumFirst.isSelf }">
                    <view class="champion-frame">
                        <view class="energy"><view class="energy-beam" /></view>
                        <view class="frame-corner tl" />
                        <view class="frame-corner tr" />
                        <view class="frame-corner bl" />
                        <view class="frame-corner br" />
                        <view class="emblem">
                            <view class="speck" />
                            <text class="crown">♛</text>
                            <view class="wreath outer" />
                            <view class="wreath mid" />
                            <view class="wreath inner" />
                            <text class="leaf">{{ emblemLeaf(1) }}</text>
                            <view class="shield">
                                <text>{{ medalMark(1) }}</text>
                            </view>
                        </view>
                        <text class="pillar-name">{{ podiumFirst.displayName }}</text>
                        <text v-if="podiumFirst.isSelf" class="you">我</text>
                        <view class="divider">
                            <view class="divider-line" />
                            <view class="divider-dot" />
                            <view class="divider-line" />
                        </view>
                        <view class="stat-line en">
                            <text class="stat-label">{{ podiumEnLabel() }}</text>
                            <text class="stat-num">{{ formatScore(podiumFirst) }}</text>
                            <text v-if="podiumEnSuffix()" class="stat-label">{{ podiumEnSuffix() }}</text>
                        </view>
                        <view class="stat-line zh">
                            <text class="stat-label">{{ podiumZhLabel() }}</text>
                            <text class="stat-num">{{ formatScore(podiumFirst) }}</text>
                            <text v-if="podiumZhSuffix()" class="stat-label">{{ podiumZhSuffix() }}</text>
                        </view>
                    </view>
                </view>

                <view v-if="podiumThird" class="pillar place-3" :class="{ self: podiumThird.isSelf }">
                    <view class="emblem">
                        <view class="speck" />
                        <view class="patina" />
                        <view class="wreath outer" />
                        <view class="wreath inner" />
                        <text class="leaf">{{ emblemLeaf(3) }}</text>
                        <view class="shield">
                            <text>{{ medalMark(3) }}</text>
                        </view>
                    </view>
                    <text class="pillar-name">{{ podiumThird.displayName }}</text>
                    <text v-if="podiumThird.isSelf" class="you">我</text>
                    <view class="divider">
                        <view class="divider-line" />
                        <view class="divider-dot" />
                        <view class="divider-line" />
                    </view>
                    <view class="stat-line en">
                        <text class="stat-label">{{ podiumEnLabel() }}</text>
                        <text class="stat-num">{{ formatScore(podiumThird) }}</text>
                        <text v-if="podiumEnSuffix()" class="stat-label">{{ podiumEnSuffix() }}</text>
                    </view>
                    <view class="stat-line zh">
                        <text class="stat-label">{{ podiumZhLabel() }}</text>
                        <text class="stat-num">{{ formatScore(podiumThird) }}</text>
                        <text v-if="podiumZhSuffix()" class="stat-label">{{ podiumZhSuffix() }}</text>
                    </view>
                </view>
            </view>

            <view class="section-rule">
                <view class="section-line" />
            </view>

            <view v-if="restEntries.length > 0" class="list">
                <view v-for="entry in restEntries" :key="entry.userId" class="row" :class="{ self: entry.isSelf }">
                    <template v-if="entry.isSelf">
                        <view class="row-corner tl" />
                        <view class="row-corner tr" />
                        <view class="row-corner bl" />
                        <view class="row-corner br" />
                    </template>
                    <text class="rank-num">{{ entry.rank }}</text>
                    <view class="avatar">
                        <text>{{ entry.avatarText }}</text>
                    </view>
                    <view class="meta">
                        <view class="name-row">
                            <text class="name">{{ entry.displayName }}</text>
                            <text v-if="entry.isSelf" class="you">我</text>
                        </view>
                        <view class="sub-row fv-inline-stat">
                            <text class="fv-inline-stat__label">物种</text>
                            <text class="fv-inline-stat__num">{{ entry.speciesCount }}</text>
                            <text class="fv-inline-stat__sep">·</text>
                            <text class="fv-inline-stat__label">战力</text>
                            <text class="fv-inline-stat__num">{{ entry.combatPower }}</text>
                        </view>
                    </view>
                    <view class="score-tag">
                        <view class="tag-pin" />
                        <view class="score fv-metric">
                            <text class="fv-metric__value">{{ formatScore(entry) }}</text>
                            <text class="fv-metric__unit">{{ scoreUnit() }}</text>
                        </view>
                    </view>
                </view>
            </view>
        </view>

        <!-- #ifdef H5 -->
        <AppTabBar />
        <!-- #endif -->
    </view>
</template>

<style lang="scss" scoped>
.page {
    position: relative;
    min-height: 100vh;
    padding: 24rpx 28rpx 180rpx;
    overflow-x: hidden;
    background-color: #0c1611;
    background-image:
        radial-gradient(rgba(212, 163, 89, 0.045) 1px, transparent 0),
        linear-gradient(180deg, #14241c 0%, #0c1611 28%, #0a120e 100%);
    background-size:
        24rpx 24rpx,
        100% 100%;
    box-shadow:
        inset 0 0 90rpx rgba(0, 0, 0, 0.42),
        inset 0 28rpx 48rpx rgba(0, 0, 0, 0.28);
}

.vault-glow {
    position: absolute;
    top: -80rpx;
    left: -60rpx;
    width: 460rpx;
    height: 380rpx;
    pointer-events: none;
    background: radial-gradient(
        ellipse at 30% 30%,
        rgba(244, 214, 150, 0.22),
        rgba(212, 163, 89, 0.06) 42%,
        transparent 70%
    );
}

.mote {
    position: absolute;
    width: 6rpx;
    height: 6rpx;
    border-radius: 50%;
    pointer-events: none;
    background: rgba(244, 222, 168, 0.85);
    box-shadow: 0 0 8rpx rgba(232, 197, 106, 0.8);
    animation: moteDrift 7s ease-in-out infinite;
}

.mote-a {
    top: 72rpx;
    left: 48rpx;
}
.mote-b {
    top: 140rpx;
    left: 180rpx;
    width: 4rpx;
    height: 4rpx;
    animation-delay: -2s;
}
.mote-c {
    top: 46rpx;
    left: 280rpx;
    animation-delay: -4s;
}
.mote-d {
    top: 210rpx;
    right: 70rpx;
    width: 4rpx;
    height: 4rpx;
    animation-delay: -1s;
}
.mote-e {
    top: 320rpx;
    left: 36rpx;
    animation-delay: -3.5s;
}

@keyframes moteDrift {
    0%,
    100% {
        transform: translateY(0);
        opacity: 0.35;
    }
    50% {
        transform: translateY(-12rpx);
        opacity: 0.9;
    }
}

.menu-mask {
    position: fixed;
    inset: 0;
    z-index: 20;
}

.header {
    position: relative;
    z-index: 30;
    margin-bottom: 20rpx;
}

.kicker {
    display: block;
    font-size: 16rpx;
    letter-spacing: 5rpx;
    color: rgba(212, 163, 89, 0.72);
}

.brand {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 14rpx;
    margin-top: 8rpx;
}

.fern {
    position: relative;
    width: 40rpx;
    height: 32rpx;
    flex-shrink: 0;
}

.fern.is-mirror {
    transform: scaleX(-1);
}

.fern-stem {
    position: absolute;
    left: 2rpx;
    bottom: 8rpx;
    width: 28rpx;
    height: 2rpx;
    border-radius: 2rpx;
    background: #c9a25c;
    transform: rotate(-16deg);
    transform-origin: left center;
}

.fern-blade {
    position: absolute;
    width: 16rpx;
    height: 7rpx;
    border-radius: 12rpx 1rpx 12rpx 1rpx;
    background: linear-gradient(180deg, #f6e7c0, #b8893e);
}

.fern-blade.b1 {
    left: 4rpx;
    top: 4rpx;
    transform: rotate(-42deg);
}

.fern-blade.b2 {
    left: 12rpx;
    top: 10rpx;
    width: 18rpx;
    transform: rotate(-8deg);
}

.fern-blade.b3 {
    left: 8rpx;
    top: 18rpx;
    transform: rotate(28deg);
}

.title {
    display: block;
    font-size: 44rpx;
    font-weight: 800;
    line-height: 1.2;
    letter-spacing: 4rpx;
    color: #f0d7a2;
    text-shadow:
        0 1rpx 0 rgba(255, 244, 214, 0.55),
        0 -1rpx 0 rgba(74, 44, 14, 0.9),
        0 4rpx 10rpx rgba(0, 0, 0, 0.35);
}

.subtitle {
    display: block;
    margin-top: 8rpx;
    font-size: 22rpx;
    color: #8ba895;
    line-height: 1.4;
}

.toolbar {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
    margin-top: 28rpx;
    min-height: 52rpx;
}

.self-hint {
    flex: 1;
    min-width: 0;
    font-size: 22rpx;
    line-height: 52rpx;
    color: #8ba895;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.metric-wrap {
    position: relative;
    flex-shrink: 0;
}

.metric-trigger {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 8rpx;
    height: 52rpx;
    padding: 0 16rpx;
    box-sizing: border-box;
    border-radius: 999rpx;
    border: 1rpx solid rgba(232, 197, 106, 0.55);
    background: linear-gradient(180deg, rgba(36, 28, 16, 0.72), rgba(16, 28, 22, 0.88));
    box-shadow:
        inset 0 1rpx 0 rgba(255, 236, 196, 0.28),
        0 4rpx 10rpx rgba(0, 0, 0, 0.25);
}

.metric-label {
    font-size: 22rpx;
    line-height: 22rpx;
    height: 22rpx;
    color: #e8c98a;
    font-weight: 600;
}

.metric-caret {
    width: 0;
    height: 0;
    flex-shrink: 0;
    border-left: 7rpx solid transparent;
    border-right: 7rpx solid transparent;
    border-top: 9rpx solid #e8c98a;
    transition: transform 0.2s ease;
    transform-origin: 50% 40%;
}

.metric-caret.open {
    transform: rotate(180deg);
}

.metric-menu {
    position: absolute;
    top: calc(100% + 8rpx);
    right: 0;
    z-index: 2;
    min-width: 200rpx;
    padding: 8rpx;
    border-radius: 12rpx;
    border: 1rpx solid rgba(212, 163, 89, 0.35);
    background: #14241c;
    box-shadow: 0 12rpx 28rpx rgba(0, 0, 0, 0.45);
}

.metric-option {
    height: 64rpx;
    padding: 0 20rpx;
    border-radius: 8rpx;
    display: flex;
    align-items: center;
    font-size: 24rpx;
    color: #8ba895;
}

.metric-option.active {
    color: #f2d58d;
    background: rgba(212, 163, 89, 0.14);
}

.board {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    padding: 18rpx 8rpx 8rpx;
    border-radius: 28rpx;
    background:
        radial-gradient(ellipse at 50% 0%, rgba(48, 32, 16, 0.22), transparent 46%),
        linear-gradient(180deg, rgba(6, 12, 9, 0.42), rgba(10, 18, 14, 0.18));
    box-shadow:
        inset 0 22rpx 36rpx rgba(0, 0, 0, 0.38),
        inset 0 -14rpx 24rpx rgba(0, 0, 0, 0.2),
        inset 0 0 0 1rpx rgba(212, 163, 89, 0.14);
}

.podium {
    position: relative;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 8rpx;
    min-height: 430rpx;
    padding: 12rpx 0 8rpx;
}

.chart {
    position: absolute;
    left: 61%;
    top: 52%;
    width: 290rpx;
    height: 290rpx;
    margin-left: -220rpx;
    margin-top: -220rpx;
    border-radius: 50%;
    border: 1rpx solid rgba(212, 163, 89, 0.1);
    box-shadow:
        inset 0 0 0 46rpx rgba(212, 163, 89, 0.035),
        inset 0 0 0 96rpx rgba(212, 163, 89, 0.03);
    pointer-events: none;
}

.pillar {
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
}

.pillar.place-2,
.pillar.place-3 {
    width: 28%;
    padding-bottom: 12rpx;
}

.pillar.place-1 {
    width: 42%;
    z-index: 2;
}

.champion-frame {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 28rpx 16rpx 26rpx;
    border-radius: 8rpx;
    border: 1rpx solid rgba(232, 197, 106, 0.72);
    background:
        linear-gradient(165deg, rgba(255, 236, 190, 0.16) 0%, transparent 28%),
        linear-gradient(180deg, rgba(42, 54, 34, 0.55), rgba(18, 30, 22, 0.25));
    box-shadow:
        inset 0 1rpx 0 rgba(255, 244, 214, 0.45),
        inset 0 0 0 1rpx rgba(242, 213, 141, 0.16),
        0 16rpx 36rpx rgba(0, 0, 0, 0.28);
}

.energy {
    position: absolute;
    top: 0;
    left: 16rpx;
    right: 16rpx;
    height: 4rpx;
    overflow: hidden;
    pointer-events: none;
}

.energy-beam {
    width: 42%;
    height: 100%;
    background: linear-gradient(90deg, transparent, #fff6d4, #e8c56a, transparent);
    animation: energyFlow 2.8s linear infinite;
}

@keyframes energyFlow {
    from {
        transform: translateX(-130%);
    }
    to {
        transform: translateX(280%);
    }
}

.frame-corner {
    position: absolute;
    width: 22rpx;
    height: 22rpx;
    pointer-events: none;
}

.frame-corner.tl {
    top: 8rpx;
    left: 8rpx;
    border-top: 2rpx solid rgba(232, 197, 106, 0.8);
    border-left: 2rpx solid rgba(232, 197, 106, 0.8);
}

.frame-corner.tr {
    top: 8rpx;
    right: 8rpx;
    border-top: 2rpx solid rgba(232, 197, 106, 0.8);
    border-right: 2rpx solid rgba(232, 197, 106, 0.8);
}

.frame-corner.bl {
    bottom: 8rpx;
    left: 8rpx;
    border-bottom: 2rpx solid rgba(232, 197, 106, 0.8);
    border-left: 2rpx solid rgba(232, 197, 106, 0.8);
}

.frame-corner.br {
    bottom: 8rpx;
    right: 8rpx;
    border-bottom: 2rpx solid rgba(232, 197, 106, 0.8);
    border-right: 2rpx solid rgba(232, 197, 106, 0.8);
}

.emblem {
    position: relative;
    width: 148rpx;
    height: 168rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8rpx;
}

.speck {
    position: absolute;
    top: 22rpx;
    left: 26rpx;
    z-index: 5;
    width: 12rpx;
    height: 6rpx;
    border-radius: 50%;
    pointer-events: none;
    background: rgba(255, 250, 230, 0.92);
    box-shadow: 0 0 8rpx rgba(255, 236, 180, 0.75);
}

.place-1 .speck {
    top: 28rpx;
    left: 36rpx;
    width: 16rpx;
}

.patina {
    position: absolute;
    top: 22rpx;
    right: 16rpx;
    bottom: 28rpx;
    left: 16rpx;
    border-radius: 50%;
    pointer-events: none;
    background:
        radial-gradient(circle at 28% 30%, rgba(126, 156, 124, 0.28), transparent 42%),
        radial-gradient(circle at 72% 68%, rgba(92, 58, 28, 0.32), transparent 48%);
}

.place-1 .emblem {
    width: 188rpx;
    height: 214rpx;
}

.wreath {
    position: absolute;
    border-radius: 50%;
    box-sizing: border-box;
}

.wreath.outer {
    width: 132rpx;
    height: 132rpx;
    border: 3rpx solid rgba(186, 204, 194, 0.55);
    box-shadow:
        0 0 0 6rpx rgba(168, 185, 174, 0.08),
        inset 0 0 0 4rpx rgba(214, 226, 218, 0.12);
}

.wreath.inner {
    width: 102rpx;
    height: 102rpx;
    border: 2rpx dashed rgba(186, 204, 194, 0.35);
}

.place-1 .wreath.outer {
    width: 168rpx;
    height: 168rpx;
    border: 4rpx solid rgba(232, 197, 106, 0.72);
    box-shadow:
        0 0 24rpx rgba(212, 163, 89, 0.28),
        0 0 0 8rpx rgba(212, 163, 89, 0.08),
        inset 0 0 0 5rpx rgba(242, 213, 141, 0.14);
}

.place-1 .wreath.mid {
    width: 146rpx;
    height: 146rpx;
    border: 1rpx solid rgba(242, 213, 141, 0.35);
}

.place-1 .wreath.inner {
    width: 124rpx;
    height: 124rpx;
    border: 2rpx dashed rgba(242, 213, 141, 0.4);
}

.place-3 .wreath.outer {
    border-color: rgba(184, 93, 67, 0.62);
    box-shadow:
        0 0 0 6rpx rgba(184, 93, 67, 0.08),
        inset 0 0 0 4rpx rgba(224, 176, 138, 0.12);
}

.place-3 .wreath.inner {
    border-color: rgba(224, 176, 138, 0.35);
}

.leaf {
    position: relative;
    z-index: 2;
    font-size: 52rpx;
    line-height: 1;
    color: #c8d6ce;
    text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.35);
}

.place-1 .leaf {
    font-size: 68rpx;
    color: #f2d58d;
    text-shadow: 0 0 18rpx rgba(232, 197, 106, 0.45);
}

.place-3 .leaf {
    color: #e0b08a;
}

.crown {
    position: absolute;
    top: -2rpx;
    z-index: 4;
    font-size: 34rpx;
    line-height: 1;
    color: #f2d58d;
    text-shadow: 0 0 12rpx rgba(232, 197, 106, 0.55);
}

.shield {
    position: absolute;
    bottom: 0;
    z-index: 3;
    min-width: 52rpx;
    height: 40rpx;
    padding: 0 12rpx;
    border-radius: 8rpx 8rpx 14rpx 14rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20rpx;
    font-weight: 800;
    letter-spacing: 1rpx;
    font-family: Georgia, "Times New Roman", serif;
    color: #1d2621;
    background: linear-gradient(180deg, #e8f0ea, #a8b9ae 70%, #7f9186);
    border: 1rpx solid rgba(255, 255, 255, 0.25);
    box-shadow: 0 6rpx 12rpx rgba(0, 0, 0, 0.35);
}

.place-1 .shield {
    min-width: 64rpx;
    height: 48rpx;
    font-size: 24rpx;
    color: #2b2110;
    background: linear-gradient(180deg, #f6e2b0, #d4a359 62%, #9b7034);
    box-shadow:
        0 8rpx 16rpx rgba(0, 0, 0, 0.38),
        0 0 14rpx rgba(232, 197, 106, 0.3);
}

.place-3 .shield {
    color: #2a1b12;
    background: linear-gradient(180deg, #e8c2a4, #b85d43 62%, #8a3f2c);
}

.pillar-name {
    display: block;
    max-width: 100%;
    margin-top: 10rpx;
    font-size: 24rpx;
    font-weight: 700;
    line-height: 1.25;
    color: #ece9df;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.place-1 .pillar-name {
    margin-top: 14rpx;
    font-size: 30rpx;
}

.you {
    flex-shrink: 0;
    margin-top: 6rpx;
    padding: 2rpx 10rpx;
    border-radius: 8rpx;
    font-size: 16rpx;
    line-height: 1.3;
    font-weight: 600;
    color: #f2d58d;
    border: 1rpx solid rgba(212, 163, 89, 0.45);
    background: rgba(23, 42, 32, 0.9);
}

.divider {
    display: flex;
    align-items: center;
    gap: 8rpx;
    width: 86%;
    margin: 14rpx auto 10rpx;
}

.place-1 .divider {
    margin-top: 16rpx;
}

.divider-line {
    flex: 1;
    height: 1rpx;
    background: rgba(212, 163, 89, 0.35);
}

.place-2 .divider-line {
    background: rgba(186, 204, 194, 0.35);
}

.place-3 .divider-line {
    background: rgba(184, 93, 67, 0.35);
}

.divider-dot {
    width: 8rpx;
    height: 8rpx;
    transform: rotate(45deg);
    background: #d4a359;
}

.place-2 .divider-dot {
    background: #a8b9ae;
}

.place-3 .divider-dot {
    background: #b85d43;
}

.stat-line {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    justify-content: center;
    gap: 6rpx;
    width: 100%;
    padding: 0 4rpx;
    box-sizing: border-box;
    white-space: nowrap;
}

.stat-line.en {
    margin-top: 0;
}

.stat-line.zh {
    margin-top: 6rpx;
}

.stat-label,
.stat-num {
    font-size: 18rpx;
    line-height: 24rpx;
    height: 24rpx;
    font-weight: 500;
}

.stat-line.en .stat-label,
.stat-line.en .stat-num {
    font-size: 16rpx;
    line-height: 22rpx;
    height: 22rpx;
    letter-spacing: 0.5rpx;
    color: #8ba895;
}

.stat-line.zh .stat-label,
.stat-line.zh .stat-num {
    color: #9aa89f;
}

.place-1 .stat-line.en .stat-label,
.place-1 .stat-line.en .stat-num {
    font-size: 18rpx;
    line-height: 24rpx;
    height: 24rpx;
    color: #c9b48a;
}

.place-1 .stat-line.zh .stat-label,
.place-1 .stat-line.zh .stat-num {
    font-size: 20rpx;
    line-height: 26rpx;
    height: 26rpx;
    color: #d4a359;
}

.stat-num {
    font-variant-numeric: tabular-nums;
}

.section-rule {
    display: flex;
    align-items: center;
    margin: 28rpx 8rpx 22rpx;
}

.section-line {
    flex: 1;
    height: 1rpx;
    background: linear-gradient(90deg, transparent, rgba(212, 163, 89, 0.35), transparent);
}

.list {
    display: flex;
    flex-direction: column;
    gap: 14rpx;
}

.row {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16rpx;
    min-height: 112rpx;
    padding: 18rpx 16rpx 18rpx 20rpx;
    border-radius: 14rpx;
    border: 1rpx solid rgba(212, 163, 89, 0.28);
    background: linear-gradient(180deg, rgba(34, 52, 40, 0.92), rgba(20, 36, 28, 0.96));
    box-shadow: inset 0 0 0 1rpx rgba(212, 163, 89, 0.12);
    box-sizing: border-box;
}

.row.self {
    border-color: rgba(232, 197, 106, 0.7);
    background:
        radial-gradient(ellipse at 18% 50%, rgba(232, 197, 106, 0.16), transparent 58%),
        linear-gradient(180deg, rgba(48, 62, 36, 0.96), rgba(24, 36, 26, 0.98));
    box-shadow:
        inset 0 0 0 1rpx rgba(242, 213, 141, 0.28),
        0 0 18rpx rgba(212, 163, 89, 0.16);
    animation: selfRipple 3.2s ease-in-out infinite;
}

.row-corner {
    position: absolute;
    width: 14rpx;
    height: 14rpx;
    pointer-events: none;
    border-color: #f0d7a2;
    border-style: solid;
    animation: cornerPulse 2.6s ease-in-out infinite;
}

.row-corner.tl {
    top: 8rpx;
    left: 8rpx;
    border-width: 2rpx 0 0 2rpx;
}
.row-corner.tr {
    top: 8rpx;
    right: 8rpx;
    border-width: 2rpx 2rpx 0 0;
}
.row-corner.bl {
    bottom: 8rpx;
    left: 8rpx;
    border-width: 0 0 2rpx 2rpx;
}
.row-corner.br {
    right: 8rpx;
    bottom: 8rpx;
    border-width: 0 2rpx 2rpx 0;
}

@keyframes cornerPulse {
    0%,
    100% {
        opacity: 0.4;
    }
    50% {
        opacity: 1;
    }
}

@keyframes selfRipple {
    0%,
    100% {
        box-shadow:
            inset 0 0 0 1rpx rgba(242, 213, 141, 0.22),
            0 0 10rpx rgba(212, 163, 89, 0.08);
    }
    50% {
        box-shadow:
            inset 0 0 0 1rpx rgba(242, 213, 141, 0.4),
            0 0 22rpx rgba(212, 163, 89, 0.22);
    }
}

.rank-num {
    width: 44rpx;
    flex-shrink: 0;
    font-size: 34rpx;
    font-weight: 700;
    line-height: 34rpx;
    height: 34rpx;
    color: #e8c98a;
    text-align: center;
    font-family: Georgia, "Times New Roman", "Songti SC", serif;
    font-variant-numeric: tabular-nums;
}

.avatar {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 800;
    color: #2b2823;
    background: radial-gradient(circle at 30% 30%, #f4efe6, #d4a359);
    border: 2rpx solid rgba(212, 163, 89, 0.7);
}

.meta {
    min-width: 0;
    flex: 1;
}

.name-row {
    display: flex;
    align-items: center;
    gap: 10rpx;
    min-width: 0;
}

.name-row .you {
    margin-top: 0;
}

.name {
    max-width: 100%;
    font-size: 28rpx;
    font-weight: 700;
    line-height: 1.2;
    color: #ece9df;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sub-row {
    margin-top: 8rpx;
    min-width: 0;
}

.score-tag {
    position: relative;
    flex-shrink: 0;
    min-width: 148rpx;
    height: 64rpx;
    padding: 8rpx 14rpx 8rpx 28rpx;
    box-sizing: border-box;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    border-radius: 4rpx;
    background:
        linear-gradient(180deg, rgba(255, 250, 232, 0.55), transparent 30%),
        linear-gradient(165deg, #f6ead0, #e4d0a2 70%, #c9aa72);
    box-shadow:
        inset 0 0 0 1rpx rgba(92, 62, 24, 0.45),
        inset 0 0 0 5rpx rgba(244, 230, 196, 0.15),
        inset 0 0 0 6rpx rgba(140, 100, 48, 0.35),
        0 4rpx 8rpx rgba(0, 0, 0, 0.22);
}

.tag-pin {
    position: absolute;
    left: 10rpx;
    top: 50%;
    width: 12rpx;
    height: 12rpx;
    margin-top: -6rpx;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #fff6d2, #e0b45a 42%, #8a5a22 100%);
    box-shadow:
        0 1rpx 2rpx rgba(60, 30, 8, 0.45),
        inset 0 1rpx 1rpx rgba(255, 255, 240, 0.8);
}

.score-tag .score {
    min-width: 0;
    height: 40rpx;
}

.score-tag .fv-metric__value {
    color: #5a3a1c;
}

.score-tag .fv-metric__unit {
    color: #8a6438;
}

.score {
    flex-shrink: 0;
    min-width: 120rpx;
    height: 44rpx;
}
</style>
