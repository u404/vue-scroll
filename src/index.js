import Comp from "./component"

Comp.install = function (Vue) {
  Vue.component(Comp.name, Comp)
}

export default Comp
