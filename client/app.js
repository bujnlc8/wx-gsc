var config = require('config')
var util = require('utils/util')
App({onLaunch(){
  try{
    var open_id = wx.getStorageSync('user_open_id')
  }catch(e){
  }
  if(!open_id){
    util.userLogin()
  }
  try{
      var today = util.formatTime(new Date())
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
  }catch(e){}
}});