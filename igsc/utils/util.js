var config = require('../config')
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return [year, month, day].map(formatNumber).join('-')
}

var timetrans = function(date) {
  var date = new Date(date * 1000);
  var Y = date.getFullYear() + '-';
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  var D = (date.getDate() < 10 ? '0' + (date.getDate()) : date.getDate()) + ' ';
  var h = (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':';
  var m = (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) + ':';
  var s = (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds());
  return Y + M + D + h + m + s;
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}


// 显示繁忙提示
var showBusy = (text, duration = 300) => wx.showToast({
  title: text,
  icon: 'loading',
  duration: duration
})

// 显示成功提示
var showSuccess = text => wx.showToast({
  title: text,
  icon: 'success'
})

// 显示失败提示
var showModel = (content) => {
  wx.hideToast();

  wx.showModal({
    content: content,
    showCancel: false
  })
}

var closeToast = () => {
  wx.hideToast()
}

var pageConfirm = (url) => {
  wx.showModal({
    content: '小程序最多能打开十层页面，是否要继续？',
    cancelText: '不要',
    confirmText: '继续',
    success: function(res) {
      if (res.confirm) {
        wx.redirectTo({
          url: url
        });
      } else {
        wx.showToast({
          title: '您可以到其他地方看看:)',
          icon: 'none',
          duration: 3000
        })
      }
    }
  });
}

var userLogin = function() {
  wx.login({
    success: function(loginCode) {
      wx.request({
        url: config.service.host + '/user/auth/' + loginCode.code,
        header: {
          'content-type': 'application/json'
        },
        success: function(res) {
          if (res.statusCode == 200) {
            if (res.data.code == 0) {
              var open_id = res.data.data.openid
              wx.setStorageSync('user_open_id', open_id)
            } else {
              wx.showToast({
                title: '获取信息失败',
                icon: 'none',
                duration: 3000
              })
            }
          } else {
            wx.showToast({
              title: '获取信息失败',
              icon: 'none',
              duration: 3000
            })
          }
        }
      })
    },
    fail: function(e) {
      console.log(e)
    }
  });
}

var loadFont = function() {
  wx.getNetworkType({
    success: function(res) {
      var networkType = res.networkType
      if (networkType == 'wifi') {
        try {
          wx.loadFontFace({
            global: true,
            family: 'syst',
            source: 'url("https://songci.nos-eastchina1.126.net/font/SourceHanSerifCN-Regular.otf")',
            complete: function(res) {
              console.log(res)
            }
          });
        } catch (e) {
          console.log(e)
        }
      }
    }
  })
}

module.exports = {
  formatTime,
  showBusy,
  showSuccess,
  showModel,
  closeToast,
  pageConfirm,
  userLogin,
  timetrans,
  loadFont
}
