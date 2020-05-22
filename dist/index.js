"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _component = require("./component");

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_component2.default.install = function (Vue) {
  Vue.component(_component2.default.name, _component2.default);
};

exports.default = _component2.default;