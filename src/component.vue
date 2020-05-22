<template>
  <div class="vue-scroll" ref="box">
    <div class="scroll-content" ref="content">
      <div class="scroll-tips scroll-top-tips" ref="topTips" v-if="top">
        <slot name="topTips" :status="status">
          <div class="scroll-tips-status" :class="topTipsStyle.class">
            <i class="scroll-tips-icon"></i>
            <span class="scroll-tips-text">{{topTipsStyle.text}}</span>
          </div>
        </slot>
      </div>
      <div class="scroll-content-body">
        <slot></slot>
      </div>
      <div class="scroll-tips scroll-bottom-tips" ref="bottomTips" v-if="bottom">
        <slot name="bottomTips" :status="status">
          <div class="scroll-tips-status" :class="bottomTipsStyle.class">
            <i class="scroll-tips-icon"></i>
            <span class="scroll-bottom-text">{{bottomTipsStyle.text}}</span>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>

import MScroll from "@sc/mscroll"

const status = {
  ready: 0,
  topWillLoading: 1,
  topLoading: 2,
  topLoaded: 3,
  bottomLoading: 6,
  error: -1
}

const Comp = {
  name: "vue-scroll",

  props: {
    load: Function,

    preload: {
      type: Number,
      default: 0.5
    },

    distance: {
      type: Number,
      default: 0
    },

    top: {
      type: Boolean,
      default: true
    },

    bottom: {
      type: Boolean,
      default: true
    },

    // 如果开启自动加载，将使用内置page，否则，使用外部
    autoLoad: {
      type: Boolean,
      default: true
    },

    ended: {
      type: Boolean,
      default: false
    },

    options: {
      type: Object,
      default () {
        return {}
      }
    }

  },

  data () {
    return {
      scroll: null,
      status: status.ready,
      page: 0,

      data: {
        topTipsHeight: 0
      }
    }
  },

  computed: {
    topTipsStyle () {
      switch (this.status) {
        case status.topWillLoading: return { class: "status-willLoading", text: "松开刷新" }
        case status.topLoading: return { class: "status-loading", text: "加载中~" }
        case status.topLoaded: return { class: "status-done", text: "加载完毕" }
        case status.error: return { class: "status-error", text: "加载失败~" }
        default: return { class: "status-ready", text: "下拉刷新" }
      }
    },
    bottomTipsStyle () {
      if (this.ended) {
        return { class: "status-ended", text: "没有更多内容啦~" }
      }

      switch (this.status) {
        case status.bottomLoading: return { class: "status-loading", text: "正在努力加载中~" }
        case status.error: return { class: "status-error", text: "加载失败~" }
        default: return { class: "status-ready", text: "正在努力加载中~" }
      }
    }
  },

  methods: {
    destroy () {
      if (this.scroll) {
        this.scroll.destroy()
        this.scroll = null
        this.data.topScrollHandle = null
        this.data.bottomScrollHandle = null
      }
    },

    _load (page) {
      return this.load(page).then(() => {
        this.page = page
        return new Promise((resolve) => {
          this.$nextTick(resolve)
        })
      }).catch(() => {
        this.status = status.error
        throw new Error("加载失败")
      })
    },

    _deepLoad (page, callback) {
      this._load(page).then(() => {
        this.scroll.refresh()
        if (this.ended) {
          callback()
          return
        }
        if (this.scroll.state.maxY >= this.scroll.state.minY) {
          this._deepLoad(this.page + 1, callback)
        } else {
          callback()
        }
      }).catch(err => console.log(err && err.message))
    },

    reload () {
      this.status = status.topLoading
      this.scroll.state.minY = this.data.topTipsHeight
      this._deepLoad(1, () => {
        this.status = status.topLoaded
        this.scroll.state.minY = 0
        this.scroll.bounce()
      })
    },

    loadMore () {
      if (this.ended) return
      this.status = status.bottomLoading
      this.scroll.state.slowDownOverflow = false
      this._deepLoad(this.page + 1, () => {
        this.scroll.refresh()
        if (!this.ended && this.scroll.state.maxY >= this.scroll.state.minY) {
          this.loadMore()
        } else {
          this.status = status.ready
          this.scroll.state.slowDownOverflow = true
          this.scroll.stopScrolling()
        }
      })
    },

    init () {
      this.destroy()

      // this.$refs.topTips.clientHeight

      const scroll = this.scroll = new MScroll(this.$refs.box, this.options)

      const topTipsHeight = this.data.topTipsHeight = this.$refs.topTips.clientHeight

      const topScrollHandle = (data) => {
        if (this.status === status.topLoading || this.status === status.bottomLoading) {
          return
        }
        if (data.touching) {
          if (data.y > topTipsHeight) {
            this.status = status.topWillLoading
          } else {
            this.status = status.ready
          }
        }
        if (this.status === status.topLoaded && data.y === 0) {
          this.status = status.ready
        }
      }

      const topTouchEndHandle = (data) => {
        if (this.status === status.topLoading || this.status === status.bottomLoading) {
          return
        }
        if (this.status === status.topWillLoading) {
          this.reload()
        } else if (this.status === status.ready) {
          scroll.state.minY !== 0 && (scroll.state.minY = 0)
        }
      }

      const bottomScrollHandle = (data) => {
        if (this.ended) {
          return
        }
        if (data.y > 0) {
          return
        }
        if (data.bouncing) {
          return
        }
        if (this.status === status.bottomLoading || this.status === status.topLoading) {
          return
        }
        const bottomLength = data.y - data.maxY
        const preloadLength = this.distance || (this.preload * data.height)

        if (bottomLength <= preloadLength) {
          this.loadMore()
        }
      }

      scroll.on("scroll", (data) => {
        this.top && topScrollHandle(data)

        this.bottom && bottomScrollHandle(data)

        this.$emit("scroll", this.scroll) // 向外暴露scroll方法
      })

      scroll.on("touchend", (data) => {
        this.top && topTouchEndHandle(data)
      })

      if (this.autoLoad) {
        this.loadMore()
      }
    },

    refresh () {
      this.scroll.refresh()
    }
  },

  mounted () {
    this.init()
  },

  status
}

export default Comp
</script>

<style lang="scss">
@import "./index.scss";
</style>
