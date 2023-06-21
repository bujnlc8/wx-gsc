import { config } from "./config";
import { cache_seek2 } from "./utils/util";

wx.setInnerAudioOption({
  obeyMuteSwitch: false,
  mixWithOther: true,
});

App({
  get_api_version: function () {
    return this.globalData.api_version;
  },
  globalData: {
    show_ad: true,
    fti: false,
    play_mode: "one",
    api_version: 20230619,
  },
  onHide() {},
  onShow() {},
  onUnload: function (e) {
    cache_seek2();
  },
  onLaunch() {
    var that = this;
    wx.getStorage({
      key: "fti",
      success: (res) => {
        if (res.data) {
          that.globalData.fti = res.data;
        }
      },
    });
    wx.getStorage({
      key: "play_mode",
      success: (res) => {
        if (res.data) {
          that.globalData.play_mode = res.data;
        }
      },
    });
    wx.request({
      url: config.service.host + "/version",
      enableHttp2: true,
      success: function (data) {
        that.globalData.api_version = data.data.v;
        wx.setStorage({
          key: "sign_audio",
          data: data.data.s + "",
        });
      },
    });
    this.check_ad();
  },
  get_open_id: function (callback) {
    var app = this;
    if (!app.globalData.open_id) {
      wx.getStorage({
        key: "user_open_id",
        success: (res) => {
          app.globalData.open_id = res.data;
          callback(res.data);
        },
        fail: (e) => {
          wx.login({
            success: function (loginCode) {
              wx.request({
                url: config.service.host + "/user/auth/" + loginCode.code,
                enableHttp2: true,
                header: {
                  "content-type": "application/json",
                },
                success: function (res) {
                  if (res.statusCode == 200) {
                    if (res.data.code == 0) {
                      var open_id = res.data.data.openid;
                      wx.setStorage({
                        key: "user_open_id",
                        data: open_id,
                      });
                      app.globalData.open_id = open_id;
                      callback(open_id);
                    }
                  }
                },
              });
            },
            fail: function (e) {
              wx.showToast({
                title: "获取用户标识失败",
                icon: "error",
              });
            },
          });
        },
      });
    } else {
      callback(app.globalData.open_id);
    }
  },
  check_ad: function () {
    var app = this;
    this.get_open_id((open_id) => {
      if (!open_id || open_id.length == 0) {
        app.globalData.show_ad = true;
        return;
      }
      wx.request({
        url: config.service.host + "/user/" + open_id + "/ad",
        enableHttp2: true,
        success: function (res) {
          if (res.data.code == 0) {
            if (res.data.data == "valid") {
              app.globalData.show_ad = false;
            } else {
              app.globalData.show_ad = true;
            }
            return;
          }
          app.globalData.show_ad = true;
        },
        fail: function (res) {
          app.globalData.show_ad = true;
        },
      });
    });
  },
});
