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
}});