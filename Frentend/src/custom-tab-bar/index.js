var PRIVATE_TABS_KEY = 'floraverse.tab.private-tabs'

function readShowPrivateTabs() {
  try {
    return wx.getStorageSync(PRIVATE_TABS_KEY) === true
  } catch (error) {
    return false
  }
}

Component({
  data: {
    selected: 'home',
    showPrivateTabs: false
  },
  lifetimes: {
    attached() {
      this.applyVisibility()
    }
  },
  pageLifetimes: {
    show() {
      this.applyVisibility()
    }
  },
  methods: {
    applyVisibility() {
      this.setData({ showPrivateTabs: readShowPrivateTabs() })
    },
    onHome() {
      wx.switchTab({ url: '/pages/home/index' })
    },
    onCollection() {
      if (!this.data.showPrivateTabs) {
        this.promptLogin()
        return
      }
      wx.switchTab({ url: '/pages/collection/index' })
    },
    onRank() {
      if (!this.data.showPrivateTabs) {
        this.promptLogin()
        return
      }
      wx.switchTab({ url: '/pages/rank/index' })
    },
    onMe() {
      wx.switchTab({ url: '/pages/me/index' })
    },
    onCapture() {
      if (!this.data.showPrivateTabs) {
        this.promptLogin()
        return
      }
      wx.navigateTo({ url: '/pages/capture/index' })
    },
    promptLogin() {
      wx.showToast({ title: '请先登录', icon: 'none' })
      wx.switchTab({ url: '/pages/me/index' })
    }
  }
})
