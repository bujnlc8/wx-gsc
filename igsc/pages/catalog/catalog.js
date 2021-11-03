var config = require('../../config')
var util = require('../../utils/util.js')
var WxSearch = require('../wxSearchView/wxSearchView.js');
Page({
  data: {
    gscitems: [],
    page: 'main',
    historyplay: null,
    showhead: true,
    currentplayId: 0
  },
  getCurrentPlayId: function() {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (this != current_page) {
      that = current_page
    }
    // 如果正在播放
    if (that.backgroundAudioManager && !that.backgroundAudioManager.paused) {
      var audioUrl = that.backgroundAudioManager.src
      if (audioUrl) {
        var re = /[0-9]+\.m4a/g
        var results = audioUrl.match(re)
        if (results && results.length > 0) {
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
  go2detail: function(e) {
    var id_ = e.target.dataset.id_
    var pages = getCurrentPages()
    var url = '/pages/songci/songci?id=' + id_
    if (pages.length == config.maxLayer) {
      //util.pageConfirm(url)
      wx.redirectTo({
        url: url,
      })
    } else {
      wx.navigateTo({
        url: url
      });
    }
  },
  getData: function(that) {
    wx.getStorage({
      key: 'songciItems' + util.formatTime(new Date()),
      success: function(res) {
        var items = res.data
        if (!items || items.length == 0) {
          that.getAllData(that);
        } else {
          that.setData({
            gscitems: items,
          })
        }
      },
      fail: function() {
        that.getAllData(that);
      }
    })
  },
  getAllData: function(context) {
    wx.showLoading({
      title: '加载中...',
    });
    wx.request({
      url: config.songciUrl + 'index/all/abc',
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
          gscitems: dd,
        });
        wx.setStorage({
          key: "songciItems" + util.formatTime(new Date()),
          data: dd
        });
        wx.hideLoading();
      },
      fail: function() {
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
  onLoad: function(options) {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (this != current_page) {
      that = current_page
    }
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
        success: function(res) {
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
              gscitems: items,
            })
            wx.hideLoading();
          }
        },
        fail: function(err) {
          that.getAllData(that);
        }
      });
    }
    clearInterval(wx.getStorageSync('currentInterval'))
    var currentInterval = setInterval(() => {
      that.getCurrentPlayId();
    }, 500)
    wx.setStorageSync('currentInterval', currentInterval)
  },
  wxSearchInput: WxSearch.wxSearchInput, // 输入变化时的操作
  wxSearchKeyTap: WxSearch.wxSearchKeyTap, // 点击提示或者关键字、历史记录时的操作
  wxSearchDeleteAll: WxSearch.wxSearchDeleteAll, // 删除所有的历史记录
  wxSearchConfirm: WxSearch.wxSearchConfirm, // 搜索函数
  wxSearchClear: WxSearch.wxSearchClear, // 清空函数
  // 4 搜索回调函数  
  mySearchFunction: function(value) {
    wx.showLoading({
      title: '加载中...'
    });
    var that = this;
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (that != current_page) {
      that = current_page
    }
    that.search_V = value
    var page = that.data.page
    var key = 'search_' + value + util.formatTime(new Date()) + '_' + page
    wx.getStorage({
      key: key,
      success: function(res) {
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
          gscitems: data
        })
        if (data.length == 0) {
          util.showSuccess('没有相关内容')
        } else {
          wx.hideLoading();
        }
      },
      fail: function() {
        var open_id = 'abcd'
        if (page == 'like') {
          try {
            open_id = wx.getStorageSync('user_open_id')
          } catch (e) {}
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
              gscitems: dd
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
          },
          fail: (e) => {
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
  myGobackFunction: function() {
    wx.reLaunch({
      url: '../songci/songci?id=1'
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (this != current_page) {
      that = current_page
    }
    that.backgroundAudioManager = wx.getBackgroundAudioManager();
    that.getCurrentPlayId()
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (that != current_page) {
      that = current_page
    }
    WxSearch.init(
      that, ['李白', '杜甫', '白居易', '苏轼', '柳永', '辛弃疾', '水龙吟', '青玉案', '蝶恋花', '与陈伯之书', '滕王阁序', '谏逐客书'], // 热点搜索推荐
      ['宋祁', '朱淑真', "吴文英", "晏几道", '秦观', '贺铸', '王安石', '李之仪', '周邦彦', '姜夔', '晏殊', '张先', '范仲淹', '晁补之', '赵佶', '宋徽宗', '张元干', '岳飞', '史达祖', '刘克庄', '蒋捷', '钱惟演', '张炎', '张孝祥', '张镃', '张抡', '青玉案', '元宵', '中秋', '蝶恋花', '满庭芳', '卜算子', '菩萨蛮', '忆江南', '浣溪沙', '诉衷情', '清平乐', '雨霖铃', '定风波', '八声甘州', '青门引', '念奴娇', '水调歌头', '洞仙歌', '渔家傲', '横塘路', '瑞龙吟', '六丑', '欧阳修', '声声慢', '永遇乐', '贺新郎', '水龙吟', '程垓', '齐天乐'], // 搜索匹配，[]表示不使用
      that.mySearchFunction, // 提供一个搜索回调函数
      that.myGobackFunction //提供一个返回回调函数
    );
    var temData = that.data.wxSearchData;
    if (that.search_V && temData) {
      if (temData.value != that.search_V) {
        temData.value = that.search_V;
        that.setData({
          wxSearchData: temData
        });
      }
    }
    wx.getStorage({
      key: 'historyplay',
      success: function(res) {
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
      },
      fail: function() {
        that.setData({
          historyplay: null
        })
      }
    });
    that.getCurrentPlayId()
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    var playingint = wx.getStorageSync('playingint')
    if (playingint) {
      clearInterval(playingint)
    }
    var currentInterval = wx.getStorageSync('currentInterval')
    if (currentInterval) {
      clearInterval(currentInterval)
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    var playingint = wx.getStorageSync('playingint')
    if (playingint) {
      clearInterval(playingint)
    }
    var currentInterval = wx.getStorageSync('currentInterval')
    if (currentInterval) {
      clearInterval(currentInterval)
    }
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (this != current_page) {
      that = current_page
    }
    that.setData({
      showhead: true
    })
    if (that.data.page == 'main') {
      var open_id = ''
      try {
        open_id = wx.getStorageSync('user_open_id')
      } catch (e) {}
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
            gscitems: dd
          })
          wx.hideLoading();
        }
      });
      wx.setNavigationBarTitle({
        title: '我的收藏'
      });
      wx.showLoading({
        title: '加载中...',
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
  onReachBottom: function() {
    return;
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function(res) {
    var that = this
    var pages = getCurrentPages()
    var current_page = pages[pages.length - 1]
    if (this != current_page) {
      that = current_page
    }
    var q = that.data.wxSearchData.value
    return {
      title: 'i古诗词-' + (q ? q : '我们都爱古诗词'),
      path: '/pages/catalog/catalog' + (q ? ('?q=' + q) : ''),
      imageUrl: '/static/share4.jpg',
      success: function(res) {
        util.showSuccess('分享成功')
      },
      fail: function(res) {
        util.showSuccess('取消分享')
      }
    }
  }
})
