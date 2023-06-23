import { simplized, traditionalized } from "../../utils/util";
import { systemInfo } from "../../config";

var __tip_keys = [];

var __search_function = null;

var __that = null;

function wx_init(that, hot_keys, tip_keys, search_function) {
  __that = that;
  __tip_keys = tip_keys;
  __search_function = search_function;

  var tem_data = {};
  if (that.search_v) {
    tem_data.value = that.search_v;
  } else {
    tem_data.value = "";
  }
  var bar_height = 30;
  var view = {
    bar_height: bar_height,
  };
  tem_data.hot_keys = hot_keys;
  var w_height = systemInfo.windowHeight;
  view.search_height = w_height - bar_height;
  tem_data.view = view;
  __that.setData({
    wx_search_data: tem_data,
  });
  get_his_keys(__that);
}

function wx_search_input(e) {
  var input_value = e.detail.value;
  var tem_data = __that.data.wx_search_data;
  var tip_keys = [];
  if (input_value && input_value.length > 0) {
    for (var i = 0; i < __tip_keys.length; i++) {
      var mind_key = __tip_keys[i];
      if (mind_key.indexOf(input_value) != -1) {
        tip_keys.push(mind_key);
      }
    }
  }
  tem_data.value = input_value;
  tem_data.tip_keys = tip_keys;
  __that.setData({
    wx_search_data: tem_data,
  });
  __that.set_scroll_height();
}

function wx_search_clear() {
  var tem_data = __that.data.wx_search_data;
  tem_data.value = "";
  tem_data.tip_keys = [];
  if (__that.search_v) {
    __that.search_v = "";
  }

  __that.setData({
    wx_search_data: tem_data,
    show_bottom_button: false,
    page_num: 1,
    search_pattern: "all",
  });
  if (__that.data.page != "like") {
    __that.get_home_data(__that);
  } else {
    __that.get_like_list();
  }
  __that.set_scroll_height();
}

function wx_search_key_tap(e) {
  wx_search(e.target.dataset.key);
  var tem_data = __that.data.wx_search_data;
  tem_data.tip_keys = [];

  __that.setData({
    wx_search_data: tem_data,
  });
}

function wx_search_confirm(e) {
  __that.data.wx_search_data.tip_keys = [];
  wx_search(__that.data.wx_search_data.value);
}

function wx_search(input_value) {
  if (input_value) {
    if (input_value != "音频") {
      wx_search_add_his_key(input_value);
    }
    var tem_data = __that.data.wx_search_data;
    tem_data.value = input_value;
    __that.setData({
      wx_search_data: tem_data,
      show_bottom_button: false,
      page_num: 1,
    });
    if (input_value == "王阳明") {
      input_value = "王守仁";
    }
    __search_function(input_value);
    wx.setNavigationBarTitle({
      title: "i古诗词",
      page: "main",
    });
  } else {
    if (__that.data.page != "like") {
      __that.get_home_data(__that);
    } else {
      __that.get_like_list();
    }
  }
}

function get_his_keys() {
  var value = [];
  wx.getStorage({
    key: "wx_search_his_keys",
    success: (res) => {
      value = res.data;
      var tem_data = __that.data.wx_search_data;
      tem_data.his = value.slice(0, 12);
      if (__that.data.fti) {
        tem_data.his = tem_data.his.map((item) => traditionalized(item));
      } else {
        tem_data.his = tem_data.his.map((item) => simplized(item));
      }
      __that.setData({
        wx_search_data: tem_data,
      });
      __that.set_scroll_height();
    },
  });
}

function wx_search_add_his_key(input_value) {
  if (!input_value || input_value.length == 0 || input_value == "undefined") {
    return;
  }
  input_value = simplized(input_value);
  wx.getStorage({
    key: "wx_search_his_keys",
    success: (res) => {
      var value = res.data;
      var index = value.indexOf(input_value);
      if (index < 0) {
        value.unshift(input_value);
      } else if (index > 0) {
        value.splice(index, 1);
        value.unshift(input_value);
      }
      wx.setStorage({
        key: "wx_search_his_keys",
        data: value,
        success: function () {
          get_his_keys(__that);
        },
      });
    },
    fail: (e) => {
      if (e.errMsg.indexOf("data not found") == -1) {
        return;
      }
      var value = [];
      value.push(input_value);
      wx.setStorage({
        key: "wx_search_his_keys",
        data: value,
        success: function () {
          get_his_keys(__that);
        },
      });
    },
  });
}

function wx_search_delete_all() {
  wx.removeStorage({
    key: "wx_search_his_keys",
    success: function () {
      var value = [];
      var tem_data = __that.data.wx_search_data;
      tem_data.his = value;
      __that.setData({
        wx_search_data: tem_data,
      });
      __that.set_scroll_height();
    },
  });
}

export {
  wx_init,
  wx_search_input,
  wx_search_key_tap,
  wx_search_delete_all,
  wx_search_confirm,
  wx_search_clear,
  wx_search,
  wx_search_add_his_key,
};
