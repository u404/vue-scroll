
import "./style/reset.scss"

import Vue from "vue"
import App from "./App"
import scroll from "@/index"

Vue.use(scroll)

new Vue({
  render: h => h(App)
}).$mount("#app")
