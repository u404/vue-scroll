<script>
import Comp from "@/index"

export default {
  components: {
    "vue-scroll": Comp
  },
  data () {
    return {
      max: 0,
      ended: false
    }
  },
  methods: {
    loadData (page) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const succ = () => {
            this.max = page * 30
            if (page === 2) {
              this.ended = true
              resolve()
              return
            }
            resolve()
          }
          succ()
          // Math.random() > 0.1 ? succ() : reject()
        }, 1000)
      })
      // return new Promise((resolve, reject) => {
      //   setTimeout(() => {
      //     this.ended = true
      //     resolve()
      //   }, 500)
      // })
    },
    reload () {
      this.$refs.scroll.reload()
    }
  }

}
</script>

<template>
  <vue-scroll class="scroll-box" :load="loadData" :ended="ended" :options="{ bounceTime: 300 }" ref="scroll">
    <ul class="test-list">
      <li class="test-item" v-for="i in max" :key="i">第{{i}}项</li>
    </ul>
  </vue-scroll>
</template>

<style lang="scss">
html, body { height: 100%; }
  .scroll-box {
    height: 100vh;
    background: green;
  }
</style>
