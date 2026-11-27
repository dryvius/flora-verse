<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { watch } from 'vue'
import { storeToRefs } from 'pinia'
import { syncTabBarPresentation } from '@/composables/useMainTabPage'
import { bootstrapDataLayer } from '@/repositories/create-repository'
import { useTabStore } from '@/stores/tab-store'
import { useUserStore } from '@/stores/user-store'

const userStore = useUserStore()
const { authStatus } = storeToRefs(userStore)

watch(authStatus, (): void => {
  syncTabBarPresentation(useTabStore().current)
})

onLaunch((): void => {
  syncTabBarPresentation(useTabStore().current)
  void bootstrapApp()
})

async function bootstrapApp(): Promise<void> {
  try {
    await bootstrapDataLayer()
    await useUserStore().bootstrap()
  } catch (error) {
    const message = error instanceof Error ? error.message : '应用初始化失败'
    uni.showToast({
      title: message,
      icon: 'none'
    })
  }
}
</script>

<style lang="scss">
@import './styles/theme.scss';
@import './styles/typography.scss';

page {
  height: 100%;
  background-color: #0f1914;
  color: #ece9df;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Hiragino Sans GB', 'Songti SC', serif;
}

/* #ifdef H5 */
html,
body,
#app,
uni-app,
uni-page,
uni-page-wrapper,
uni-page-body {
  background-color: #0f1914;
}
/* #endif */

@keyframes cardStaggerIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes stampDown {
  0% {
    transform: scale(2) rotate(-15deg);
    opacity: 0;
  }
  70% {
    transform: scale(0.9) rotate(-15deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(-15deg);
  }
}

@keyframes compassSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shutterRipple {
  0% {
    transform: scale(0.6);
    opacity: 0.45;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}

view,
text,
button,
image {
  box-sizing: border-box;
}

button {
  margin: 0;
  padding: 0;
  background: transparent;
  line-height: inherit;
  font-size: inherit;

  &::after {
    border: none;
  }
}

uni-tabbar,
.uni-tabbar-bottom {
  display: none !important;
}
</style>
