// pages/catalog/catalog.js
var config = require('../../config')
var util = require('../../utils/util.js')
var WxSearch = require('../wxSearchView/wxSearchView.js');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    items: [],
    page: 'main',
    historyplay:null,
    showhead:true
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
    util.showBusy('加载中', 20000)
    wx.request({
      url: config.songciUrl + 'index/all',
      success(result) {
        if (!result || result.data.code != 0) {
          wx.showToast({
            title: '网络异常',
            icon: 'none'
          });
          return
        }
        var datas = result.data.data.data
        var dd = []
        for (var data of datas) {
          var splits = data.content.split("。")
          if (splits.length > 0) {
            data.short_content = splits[0]
          } else {
            data.short_content = data.content
          }
          data.short_content += '。'
          dd.push(data)
        }
        context.setData({
          items: dd,
        });
        util.closeToast()
        wx.setStorage({
          key: "songciItems"+util.formatTime(new Date()),
          data: dd
        });
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
      ['苏轼', '李白', "李清照", "柳永", '辛弃疾', '杜甫', '水龙吟', '青玉案', '蝶恋花'], // 热点搜索推荐
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
          if(!res){
            wx.showToast({
              title: '加载失败',
              icon: 'none'
            });
            return
          }
          var items = res.data
          if (!items || items.length == 0) {
            that.getAllData(that);
          } else {
            util.showBusy('加载中', 15000)
            that.setData({
              items: items,
            })
            util.closeToast()
          }
        },
        fail: function (err) {
          that.getAllData(that);
        }
      });
    }
  },
  wxSearchInput: WxSearch.wxSearchInput,  // 输入变化时的操作
  wxSearchKeyTap: WxSearch.wxSearchKeyTap,  // 点击提示或者关键字、历史记录时的操作
  wxSearchDeleteAll: WxSearch.wxSearchDeleteAll, // 删除所有的历史记录
  wxSearchConfirm: WxSearch.wxSearchConfirm,  // 搜索函数
  wxSearchClear: WxSearch.wxSearchClear,  // 清空函数

  // 4 搜索回调函数  
  mySearchFunction: function (value) {
    var that = this;
    if(that.data.showhead){
      util.showBusy('加载中...', 120000)
    }else{
      util.showBusy('搜索中...', 120000)
    }
    var key = 'search_' + value + util.formatTime(new Date())
    wx.getStorage({
      key: key,
      success: function (res) {
        if (res) {
          var data = res.data
        } else {
          wx.showToast({
            title: '操作失败',
            icon: 'none'
          })
         return
        }
        that.setData({
          items: data,
        });
        if (data.length == 0) {
          util.showSuccess('没有结果')
        } else {
          if (that.data.showhead){
            util.showSuccess('搜索成功')
          }else{
            util.showSuccess('加载成功')
          }
        }
      },
      fail: function () {
        wx.request({
          url: config.songciUrl + 'query/' + value,
          success(result) {
            if (!result || result.data.code != 0) {
              wx.showToast({
                title: '操作失败',
                icon: 'none'
              })
              return
            }
            var datas = result.data.data.data
            var dd = []
            for (var data of datas) {
              var splits = data.content.split("。")
              if (splits.length > 0) {
                data.short_content = splits[0]
              } else {
                data.short_content = data.content
              }
              data.short_content += '。'
              dd.push(data)
            }
            that.setData({
              items: dd
            });
            wx.setStorage({
              key: key,
              data: dd,
            });
            if (dd.length > 0) {
              if (that.data.showhead){
                util.showSuccess('搜索成功')
              }else{
                util.showSuccess('加载成功')
              }
            } else {
              util.showSuccess('没有结果')
            }
          },fail:(e)=>{
            wx.showToast({
              title: '操作失败',
              icon:'none'
            })
          }
        });
      }
    });
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
          for (var x in historyplay){
              historylist.push(historyplay[x])
          }
          historylist.sort((a, b)=>{
            return parseInt(b.playtimes) - parseInt(a.playtimes)
          })
          historylist = historylist.slice(0,10)
          for (var x in historylist){
            if (historylist[x].playtimes>99){
              historylist[x].playtimes = '99+'
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
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      showhead:true
    })
    var open_id = ''
    var that = this
    try {
      open_id = wx.getStorageSync('user_open_id')
    } catch (e) {
    }
    if (!open_id) {
      util.userLogin()
      wx.showToast({
        title: '请再试一次',
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
            title: '操作失败',
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
          if (splits.length > 0) {
            data.short_content = splits[0]
          } else {
            data.short_content = data.content
          }
          data.short_content += '。'
          dd.push(data)
        }
        that.setData({
          items: dd,
          page: 'like'
        });
        wx.setNavigationBarTitle({
          title: '我的收藏'
        });
        wx.hideNavigationBarLoading()
        wx.stopPullDownRefresh()
      }
    });
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
    return {
      title: 'i古诗词--我们都爱古诗词',
      path: '/pages/catalog/catalog',
      imageUrl: '/static/share.jpeg',
      success: function (res) {
        util.showSuccess('分享成功')
      },
      fail: function (res) {
        util.showSuccess('取消分享')
      }
    }
  }
})