<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthState } from '@/composables/useAuthState'
import {
    LOGOUT_COPY,
    canShowLogout,
    confirmLogout,
    requestLogout
} from '@/pages/me/settings-logout'
import type { LogoutRequestOptions } from '@/pages/me/settings-logout'
import { useUserStore } from '@/stores/user-store'
import { returnToMe } from '@/utils/navigation'

const { authStatus } = useAuthState()
const loggingOut = ref(false)
const logoutMessage = ref('')
const showLogout = computed((): boolean => canShowLogout(authStatus.value))
const logoutAction = LOGOUT_COPY.action

function handleLogout(): void {
    if (loggingOut.value) {
        return
    }
    logoutMessage.value = ''
    const options: LogoutRequestOptions = {
        confirm: confirmLogout,
        logout: (): Promise<void> => useUserStore().logout(),
        returnToMe,
        isLoggingOut: (): boolean => loggingOut.value,
        setLoggingOut: (value: boolean): void => {
            loggingOut.value = value
        },
        onError: (message: string): void => {
            logoutMessage.value = message
        }
    }
    void requestLogout(options)
}
</script>

<template>
    <view class="page">
        <text class="kicker">PRIVACY</text>
        <text class="title">设置与隐私</text>
        <text class="body">当前为 Mock MVP：使用固定演示用户，不采集精确位置，也不会把照片发送到真实识别服务。</text>
        <text class="body">植物照片仅保存在本机 Mock 存储中，用于演示收录、图鉴和详情回看。</text>
        <text class="body">账号注销、图鉴搜索筛选与成就将在后续阶段提供。</text>
        <view v-if="showLogout" class="logout" :class="{ 'logout--busy': loggingOut }" @tap="handleLogout">
            <text>{{ logoutAction }}</text>
            <text class="arrow">›</text>
        </view>
        <text v-if="logoutMessage" class="error">{{ logoutMessage }}</text>
    </view>
</template>

<style lang="scss" scoped>
.page {
    min-height: 100vh;
    padding: 40rpx 32rpx;
    background: #07140f;
}

.kicker {
    font-size: 20rpx;
    letter-spacing: 8rpx;
    color: #e8c56a;
}

.title {
    display: block;
    font-size: 40rpx;
    font-weight: 800;
    margin: 12rpx 0 24rpx;
}

.body {
    display: block;
    margin-bottom: 16rpx;
    color: #8ea394;
    font-size: 26rpx;
    line-height: 1.7;
}

.logout {
    margin-top: 48rpx;
    padding: 32rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 16rpx;
    border: 1rpx solid rgba(232, 197, 106, 0.25);
    background: rgba(14, 34, 26, 0.94);
    color: #f4efe2;
    font-size: 28rpx;
}

.logout--busy {
    opacity: 0.6;
}

.arrow {
    color: #e8c56a;
}

.error {
    display: block;
    margin-top: 16rpx;
    color: #e7b3a2;
    font-size: 24rpx;
    line-height: 1.6;
}
</style>
