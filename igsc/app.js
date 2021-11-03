var config = require('config')
var util = require('utils/util')
App({
  get_music_list: function() {
    var value = "音频"
    var key = 'search_音频' + util.formatTime(new Date())
    wx.getStorage({
      key: key,
      success: function(res) {
        if (res && res.data) {
          var data = res.data
          var music_ids = []
          for (var index = 0; index < data.length; index++) {
            music_ids.push(data[index].id)
          }
          wx.setStorageSync('music_ids', music_ids)
        }
      },
      fail: function() {
        wx.request({
          url: config.songciUrl + 'query/' + value + "/main/abcd",
          success(result) {
            if (!result || result.data.code != 0) {
              return
            }
            var music_ids = []
            var data = result.data.data.data
            for (var index = 0; index < data.length; index++) {
              music_ids.push(data[index].id)
            }
            wx.setStorageSync('music_ids', music_ids)
            wx.setStorage({
              key: key,
              data: data
            });
          }
        });
      }
    });
  },
  onLaunch() {
    try {
      var open_id = wx.getStorageSync('user_open_id')
    } catch (e) {}
    if (!open_id) {
      util.userLogin()
    }
    try {
      var today = util.formatTime(new Date())
      open_id = wx.getStorageSync('user_open_id')
      var play_mode = wx.getStorageSync('play_mode')
      today = today.replace(/-/g, '')
      var historyplay = wx.getStorageSync('historyplay')
      var today_clear = wx.getStorageSync('clear_1' + today)
      if (!today_clear || today_clear != 1) {
        wx.clearStorage();
      }
      wx.setStorage({
        key: 'clear_1' + today,
        data: 1,
      })
      wx.setStorage({
        key: 'historyplay',
        data: historyplay
      })
      if (open_id) {
        wx.setStorage({
          key: 'user_open_id',
          data: open_id
        })
      }
      wx.setStorageSync('play_mode', play_mode ? play_mode : 'xunhuan')
    } catch (e) {}
    // 加载字体
    util.loadFont()
  }
});
