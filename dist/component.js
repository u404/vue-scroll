"use strict";

;(function () {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _promise = require("babel-runtime/core-js/promise");

  var _promise2 = _interopRequireDefault(_promise);

  var _mscroll = require("@sc/mscroll");

  var _mscroll2 = _interopRequireDefault(_mscroll);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var status = {
    ready: 0,
    topWillLoading: 1,
    topLoading: 2,
    topLoaded: 3,
    bottomLoading: 6,
    error: -1
  };

  var Comp = {
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
        default: function _default() {
          return {};
        }
      }

    },

    data: function data() {
      return {
        scroll: null,
        status: status.ready,
        page: 0,

        data: {
          topTipsHeight: 0
        }
      };
    },

    computed: {
      topTipsStyle: function topTipsStyle() {
        switch (this.status) {
          case status.topWillLoading:
            return { class: "status-willLoading", text: "松开刷新" };
          case status.topLoading:
            return { class: "status-loading", text: "加载中~" };
          case status.topLoaded:
            return { class: "status-done", text: "加载完毕" };
          case status.error:
            return { class: "status-error", text: "加载失败~" };
          default:
            return { class: "status-ready", text: "下拉刷新" };
        }
      },
      bottomTipsStyle: function bottomTipsStyle() {
        if (this.ended) {
          return { class: "status-ended", text: "没有更多内容啦~" };
        }

        switch (this.status) {
          case status.bottomLoading:
            return { class: "status-loading", text: "正在努力加载中~" };
          case status.error:
            return { class: "status-error", text: "加载失败~" };
          default:
            return { class: "status-ready", text: "正在努力加载中~" };
        }
      }
    },

    methods: {
      destroy: function destroy() {
        if (this.scroll) {
          this.scroll.destroy();
          this.scroll = null;
          this.data.topScrollHandle = null;
          this.data.bottomScrollHandle = null;
        }
      },
      _load: function _load(page) {
        var _this = this;

        return this.load(page).then(function () {
          _this.page = page;
          return new _promise2.default(function (resolve) {
            _this.$nextTick(resolve);
          });
        }).catch(function () {
          _this.status = status.error;
          throw new Error("加载失败");
        });
      },
      _deepLoad: function _deepLoad(page, callback) {
        var _this2 = this;

        this._load(page).then(function () {
          _this2.scroll.refresh();
          if (_this2.ended) {
            callback();
            return;
          }
          if (_this2.scroll.state.maxY >= _this2.scroll.state.minY) {
            _this2._deepLoad(_this2.page + 1, callback);
          } else {
            callback();
          }
        }).catch(function (err) {
          return void 0;
        });
      },
      reload: function reload() {
        var _this3 = this;

        this.status = status.topLoading;
        this.scroll.state.minY = this.data.topTipsHeight;
        this._deepLoad(1, function () {
          _this3.status = status.topLoaded;
          _this3.scroll.state.minY = 0;
          _this3.scroll.bounce();
        });
      },
      loadMore: function loadMore() {
        var _this4 = this;

        if (this.ended) return;
        this.status = status.bottomLoading;
        this.scroll.state.slowDownOverflow = false;
        this._deepLoad(this.page + 1, function () {
          _this4.scroll.refresh();
          if (!_this4.ended && _this4.scroll.state.maxY >= _this4.scroll.state.minY) {
            _this4.loadMore();
          } else {
            _this4.status = status.ready;
            _this4.scroll.state.slowDownOverflow = true;
            _this4.scroll.stopScrolling();
          }
        });
      },
      init: function init() {
        var _this5 = this;

        this.destroy();

        var scroll = this.scroll = new _mscroll2.default(this.$refs.box, this.options);

        var topTipsHeight = this.data.topTipsHeight = this.$refs.topTips.clientHeight;

        var topScrollHandle = function topScrollHandle(data) {
          if (_this5.status === status.topLoading || _this5.status === status.bottomLoading) {
            return;
          }
          if (data.touching) {
            if (data.y > topTipsHeight) {
              _this5.status = status.topWillLoading;
            } else {
              _this5.status = status.ready;
            }
          }
          if (_this5.status === status.topLoaded && data.y === 0) {
            _this5.status = status.ready;
          }
        };

        var topTouchEndHandle = function topTouchEndHandle(data) {
          if (_this5.status === status.topLoading || _this5.status === status.bottomLoading) {
            return;
          }
          if (_this5.status === status.topWillLoading) {
            _this5.reload();
          } else if (_this5.status === status.ready) {
            scroll.state.minY !== 0 && (scroll.state.minY = 0);
          }
        };

        var bottomScrollHandle = function bottomScrollHandle(data) {
          if (_this5.ended) {
            return;
          }
          if (data.y > 0) {
            return;
          }
          if (data.bouncing) {
            return;
          }
          if (_this5.status === status.bottomLoading || _this5.status === status.topLoading) {
            return;
          }
          var bottomLength = data.y - data.maxY;
          var preloadLength = _this5.distance || _this5.preload * data.height;

          if (bottomLength <= preloadLength) {
            _this5.loadMore();
          }
        };

        scroll.on("scroll", function (data) {
          _this5.top && topScrollHandle(data);

          _this5.bottom && bottomScrollHandle(data);

          _this5.$emit("scroll", _this5.scroll);
        });

        scroll.on("touchend", function (data) {
          _this5.top && topTouchEndHandle(data);
        });

        if (this.autoLoad) {
          this.loadMore();
        }
      },
      refresh: function refresh() {
        this.scroll.refresh();
      }
    },

    mounted: function mounted() {
      this.init();
    },

    status: status
  };

  exports.default = Comp;
})();
if (module.exports.__esModule) module.exports = module.exports.default;
var __vue__options__ = typeof module.exports === "function" ? module.exports.options : module.exports;
__vue__options__.render = function render() {
  var _vm = this;var _h = _vm.$createElement;var _c = _vm._self._c || _h;return _c('div', { ref: "box", staticClass: "vue-scroll" }, [_c('div', { ref: "content", staticClass: "scroll-content" }, [_vm.top ? _c('div', { ref: "topTips", staticClass: "scroll-tips scroll-top-tips" }, [_vm._t("topTips", [_c('div', { staticClass: "scroll-tips-status", class: _vm.topTipsStyle.class }, [_c('i', { staticClass: "scroll-tips-icon" }), _vm._v(" "), _c('span', { staticClass: "scroll-tips-text" }, [_vm._v(_vm._s(_vm.topTipsStyle.text))])])], { "status": _vm.status })], 2) : _vm._e(), _vm._v(" "), _c('div', { staticClass: "scroll-content-body" }, [_vm._t("default")], 2), _vm._v(" "), _vm.bottom ? _c('div', { ref: "bottomTips", staticClass: "scroll-tips scroll-bottom-tips" }, [_vm._t("bottomTips", [_c('div', { staticClass: "scroll-tips-status", class: _vm.bottomTipsStyle.class }, [_c('i', { staticClass: "scroll-tips-icon" }), _vm._v(" "), _c('span', { staticClass: "scroll-bottom-text" }, [_vm._v(_vm._s(_vm.bottomTipsStyle.text))])])], { "status": _vm.status })], 2) : _vm._e()])]);
};
__vue__options__.staticRenderFns = [];