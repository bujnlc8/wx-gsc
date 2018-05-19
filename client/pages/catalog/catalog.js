// pages/catalog/catalog.js
var config = require('../../config')
var util = require('../../utils/util.js')
var WxSearch = require('../wxSearchView/wxSearchView.js');
Page({
  data: {
    items: [],
    page: 'main',
    historyplay: null,
    showhead: true,
    currentplayId: 0,
    animationData: {},
    playinganimation: {}
  },
  getCurrentPlayId: function () {
    var that = this
    // 如果正在播放
    if (that.backgroundAudioManager && !that.backgroundAudioManager.paused) {
      var audioUrl = that.backgroundAudioManager.src
      if (audioUrl) {
        var re = /[0-9]+\.m4a/g
        var results = audioUrl.match(re)
        if (results.length > 0) {
          results = results[0].slice(0, -4)
          that.setData({
            currentplayId: results
          })
          return true
        }
      }
    }
    that.setData({
      currentplayId: 0
    })
    return false
  },
  go2detail: function (e) {
    var id_ = e.target.dataset.id_
    var pages = getCurrentPages()
    var url = '/pages/songci/songci?id=' + id_
    if (pages.length == config.maxLayer) {
      util.pageConfirm(url)
    } else {
      wx.navigateTo({
        url: url
      });
    }
  },
  getData: function (that) {
    wx.getStorage({
      key: 'songciItems' + util.formatTime(new Date()),
      success: function (res) {
        var items = res.data
        if (!items || items.length == 0) {
          that.getAllData(that);
        } else {
          that.setData({
            items: items,
          })
        }
      },
      fail: function () {
        that.getAllData(that);
      }
    })
  },
  getAllData: function (context) {
    wx.showLoading({
      title: '加载中...',
    });
    wx.request({
      url: config.songciUrl + 'index/all',
      success(result) {
        if (!result || result.data.code != 0) {
          wx.showToast({
            title: '网络异常~~',
            icon: 'none'
          });
          return
        }
        var datas = result.data.data.data
        var dd = []
        for (var data of datas) {
          var splits = data.content.split("。")
          var fuhao = '。'
          if (splits.length > 0) {
            if (splits[0].indexOf('？') >= 0) {
              fuhao = "？"
            }
            data.short_content = splits[0].split('？')[0]
          } else {
            data.short_content = data.content
          }
          data.short_content += fuhao
          dd.push(data)
        }
        context.setData({
          items: dd,
        });
        wx.setStorage({
          key: "songciItems" + util.formatTime(new Date()),
          data: dd
        });
        wx.hideLoading();
      }, fail: function () {
        wx.hideLoading();
        wx.showToast({
          title: '加载失败:(',
          icon: 'none'
        })
      }
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    WxSearch.init(
      that,
      ['苏轼', '李白', "李清照", "柳永", '辛弃疾', '杜甫', '水龙吟', '青玉案', '蝶恋花', '与陈伯之书', '滕王阁序'], // 热点搜索推荐
      ['宋祁', '朱淑真', "吴文英", "晏几道", '秦观', '贺铸', '王安石', '李之仪', '周邦彦', '姜夔', '晏殊', '张先', '范仲淹', '晁补之', '赵佶', '宋徽宗', '张元干', '岳飞', '史达祖', '刘克庄', '蒋捷', '钱惟演', '张炎', '张孝祥', '张镃', '张抡', '青玉案', '元宵', '中秋', '蝶恋花', '满庭芳', '卜算子', '菩萨蛮', '忆江南', '浣溪沙', '诉衷情', '清平乐', '雨霖铃', '定风波', '八声甘州', '青门引', '念奴娇', '水调歌头', '洞仙歌', '渔家傲', '横塘路', '瑞龙吟', '六丑', '欧阳修', '声声慢', '永遇乐', '贺新郎', '水龙吟', '程垓', '齐天乐'],// 搜索匹配，[]表示不使用
      that.mySearchFunction, // 提供一个搜索回调函数
      that.myGobackFunction //提供一个返回回调函数
    );
    if (options.hasOwnProperty('q')) {
      if (options.q == '音频') {
        that.setData({
          showhead: false
        })
      } else {
        that.setData({
          showhead: true
        })
      }
      that.mySearchFunction(options.q);
      WxSearch.search(options.q)
    } else {
      wx.getStorage({
        key: 'songciItems' + util.formatTime(new Date()),
        success: function (res) {
          if (!res) {
            wx.showToast({
              title: '加载失败:(',
              icon: 'none'
            });
            return
          }
          var items = res.data
          if (!items || items.length == 0) {
            that.getAllData(that);
          } else {
            wx.showLoading({
              title: '加载中...',
            })
            that.setData({
              items: items,
            })
            wx.hideLoading();
          }
        },
        fail: function (err) {
          that.getAllData(that);
        }
      });
    }
    var currentInterval = setInterval(()=>{
      that.getCurrentPlayId(); 
    }, 450)
    that.currentInterval =currentInterval
  },
  wxSearchInput: WxSearch.wxSearchInput,  // 输入变化时的操作
  wxSearchKeyTap: WxSearch.wxSearchKeyTap,  // 点击提示或者关键字、历史记录时的操作
  wxSearchDeleteAll: WxSearch.wxSearchDeleteAll, // 删除所有的历史记录
  wxSearchConfirm: WxSearch.wxSearchConfirm,  // 搜索函数
  wxSearchClear: WxSearch.wxSearchClear,  // 清空函数

  // 4 搜索回调函数  
  mySearchFunction: function (value) {
    wx.showLoading({
      title: '加载中...'
    });
    var that = this;
    var page = that.data.page
    var key = 'search_' + value + util.formatTime(new Date()) + '_' + page
    wx.getStorage({
      key: key,
      success: function (res) {
        if (res) {
          var data = res.data
        } else {
          wx.showToast({
            title: '网络异常~~',
            icon: 'none'
          })
          return
        }
        that.setData({
          items: data,
        });
        if (data.length == 0) {
          util.showSuccess('没有相关内容')
        } else {
          wx.hideLoading();
        }
      },
      fail: function () {
        var open_id = 'abcd'
        if (page == 'like') {
          try {
            open_id = wx.getStorageSync('user_open_id')
          } catch (e) {
          }
          if (!open_id) {
            util.userLogin()
            wx.showToast({
              title: '请重试一次',
              icon: 'none'
            });
          }
        }
        wx.request({
          url: config.songciUrl + 'query/' + value + '/' + page + '/' + open_id,
          success(result) {
            if (!result || result.data.code != 0) {
              wx.showToast({
                title: '网络异常~~',
                icon: 'none'
              })
              return
            }
            var datas = result.data.data.data
            var dd = []
            for (var data of datas) {
              var splits = data.content.split("。")
              var fuhao = '。'
              if (splits.length > 0) {
                if (splits[0].indexOf('？') >= 0) {
                  fuhao = "？"
                }
                data.short_content = splits[0].split('？')[0]
              } else {
                data.short_content = data.content
              }
              data.short_content += fuhao
              dd.push(data)
            }
            that.setData({
              items: dd
            });
            wx.setStorage({
              key: key,
              data: dd,
            });
            if (dd.length == 0) {
              util.showSuccess('没有相关内容')
            } else {
              wx.hideLoading();
            }
          }, fail: (e) => {
            wx.showToast({
              title: '网络异常~~',
              icon: 'none'
            })
          }
        });
      }
    });
    setTimeout(() => {
      if (page == 'like') {
        wx.setNavigationBarTitle({
          title: '我的收藏'
        });
      } else {
        wx.setNavigationBarTitle({
          title: 'i古诗词'
        });
      }
    }, 200);
  },
  // 5 返回回调函数
  myGobackFunction: function () {
    wx.reLaunch({
      url: '../songci/songci?id=1'
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    this.backgroundAudioManager = wx.getBackgroundAudioManager();
    this.getCurrentPlayId()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var that = this
    wx.getStorage({
      key: 'historyplay',
      success: function (res) {
        if (res) {
          var historylist = []
          var historyplay = res.data
          for (var x in historyplay) {
            historylist.push(historyplay[x])
          }
          historylist.sort((a, b) => {
            return parseInt(b.times) - parseInt(a.times)
          })
          historylist = historylist.slice(0, 10)
          for (var x in historylist) {
            if (historylist[x].times > 99) {
              historylist[x].times = '99+'
            }
          }
          that.setData({
            historyplay: historylist
          })
        } else {
          that.setData({
            historyplay: null
          })
        }
      }, fail: function () {
        that.setData({
          historyplay: null
        })
      }
    });
    that.getCurrentPlayId()
    var animation1 = wx.createAnimation({
      duration: 1000,
      timingFunction: 'ease',
    })
    that.animation = animation1
    animation1.scale(1, 1.5).rotate(360).step()
    that.setData({
      animationData: animation1.export()
    })
    this.setplayinganimation()
  },
  setplayinganimation:function(){
    var that = this
    var animation = wx.createAnimation({
      timingFunction: 'linear',
      delay: 0,
      transformOrigin: '50% 50% 0'
    });
    animation.rotate(30).step({ duration: 100 })
    this.setData({
      playinganimation: animation.export()
    })
    setTimeout(() => {
      var n = 1
      var int = setInterval(function () {
        animation.rotate(180 * n).step({ duration: 600 })
        this.setData({
          playinganimation: animation.export()
        })
        n++;
      }.bind(that), 500)
      that.playingint = int
    }, 200)
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    if (this.playingint){
      clearInterval(this.playingint)
    }
    if (this.currentInterval){
      clearInterval(this.currentInterval)
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    if (this.playingint) {
      clearInterval(this.playingint)
    }
    if (this.currentInterval) {
      clearInterval(this.currentInterval)
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this
    that.setData({
      showhead: true
    })
    if (that.data.page == 'main') {
      var open_id = ''
      try {
        open_id = wx.getStorageSync('user_open_id')
      } catch (e) {
      }
      if (!open_id) {
        util.userLogin()
        wx.showToast({
          title: '请重试一次',
          icon: 'none'
        });
        wx.hideNavigationBarLoading()
        wx.stopPullDownRefresh()
        return
      }
      wx.request({
        url: config.songciUrl + 'mylike/' + open_id,
        success(result) {
          if (!result || result.data.code != 0) {
            wx.showToast({
              title: '网络异常~~',
              icon: 'none'
            });
            wx.hideNavigationBarLoading()
            wx.stopPullDownRefresh()
            return
          }
          var datas = result.data.data.data
          var dd = []
          for (var data of datas) {
            var splits = data.content.split("。")
            var fuhao = '。'
            if (splits.length > 0) {
              if (splits[0].indexOf('？') >= 0) {
                fuhao = "？"
              }
              data.short_content = splits[0].split('？')[0]
            } else {
              data.short_content = data.content
            }
            data.short_content += fuhao
            dd.push(data)
          }
          that.setData({
            items: dd
          })
        }
      });
      wx.setNavigationBarTitle({
        title: '我的收藏'
      });
    } else {
      wx.setNavigationBarTitle({
        title: 'i古诗词'
      });
      that.getData(that);
    }
    if (that.data.page == 'main') {
      that.setData({
        page: 'like'
      });
    } else {
      that.setData({
        page: 'main'
      });
    }
    wx.hideNavigationBarLoading()
    wx.stopPullDownRefresh()
    WxSearch.wxSearchClear()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    return;
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    var q = this.data.wxSearchData.value
    return {
      title: 'i古诗词--' + (q ? q : '我们都爱古诗词'),
      path: '/pages/catalog/catalog' + (q ? ('?q=' + q) : ''),
      imageUrl: '/static/share4.jpg',
      success: function (res) {
        util.showSuccess('分享成功')
      },
      fail: function (res) {
        util.showSuccess('取消分享')
      }
    }
  }
})