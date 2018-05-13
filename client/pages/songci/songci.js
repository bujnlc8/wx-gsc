// pages/songci/songci.js
var config = require('../../config')
var util = require('../../utils/util.js')
Page({
  data: {
    songciItem: null,
    audioId: 1,
    duration: 0,
    audioUrl: '',
    currentSongci: '',
    poster: 'http://r.photo.store.qq.com/psb?/V121Rqgy1YUsix/nJ4Eibo686t9B1X3x34tDI6B66fSRpm1X*pm8OX0YvQ!/r/dFYBAAAAAAAA',
    currentTab: 0,
    show_content: '',
    playing: false,
    duration_show: '',
    current_time_show: '',
    seek2: 0,
    slideValue: 0,
    mode: 'xunhuan',
    time2close: 0,
    closeplaytime: 0
  },
  setTimed: function () {
    var that = this
    wx.showActionSheet({
      itemList: ['2小时', '1小时', '30分钟', '10分钟'],
      success: function (res) {
        var index = res.tapIndex
        var seconds = 0
        switch (index) {
          case 0:
            seconds = 7200
            break
          case 1:
            seconds = 3600
            break
          case 2:
            seconds = 1800
            break
          case 3:
            seconds = 600
            break
        }
        var time2close = (new Date).getTime() / 1000 + seconds
        if (that.data.playing) {
          wx.showToast({
            title: '播放器将于' + util.timetrans(time2close).slice(11) + '关闭',
            icon: 'none'
          })
          wx.setStorageSync('time2close', time2close)
          wx.setStorageSync('closeplaytime', seconds / 60)
          that.setData({
            time2close: time2close,
            closeplaytime: seconds / 60
          })
        } else {
          wx.showToast({
            title: '请先打开播放器',
            icon: 'none'
          })
        }
      },
      fail: function (res) {
        wx.removeStorageSync('time2close')
        wx.removeStorageSync('closeplaytime')
        if (that.data.time2close != 0) {
          wx.showToast({
            title: '取消成功',
            icon: 'none'
          })
        }
        that.setData({
          time2close: 0,
          closeplaytime: 0
        })
      }
    })
  },
  change_mode: function () {
    //xunhuan->one->shuffle->xunhuan
    var mode = "xunhuan"
    if (this.data.mode == 'xunhuan') {
      this.setData({
        mode: "one"
      })
      mode = "one"
      wx.showToast({
        title: '单曲循环',
        icon: 'none'
      })
    } else if (this.data.mode == 'one') {
      this.setData({
        mode: "shuffle"
      })
      wx.showToast({
        title: '随机播放',
        icon: 'none'
      })
      mode = "shuffle"
    } else if (this.data.mode == 'shuffle') {
      this.setData({
        mode: "xunhuan"
      })
      wx.showToast({
        title: "循环播放",
        icon: 'none'
      })
      mode = "xunhuan"
    }
    try {
      wx.setStorageSync('play_mode', mode)
    } catch (e) { }
  },
  get_by_id: function (key) {
    var that = this
    wx.getStorage({
      key: 'songci' + key + util.formatTime(new Date()),
      success: function (res) {
        var d = res.data;
        that.setData(d);
      },
      fail: function () {
        var open_id = ''
        try {
          open_id = wx.getStorageSync('user_open_id')
        } catch (e) {
        }
        if (!open_id) {
          util.userLogin()
        }
        wx.request({
          url: config.songciUrl + 'index/' + key + '/' + open_id,
          success(result) {
            if (!result || result.data.code != 0) {
              wx.showToast({
                title: '网络异常',
                icon: 'none'
              })
              return
            }
            var target_id = 0
            var work = result.data.data.data
            var show_content = ''
            if (work.intro) {
              target_id = 0
              show_content = work.intro
            } else if (work.annotation) {
              target_id = 1
              show_content = work.annotation
            } else if (work.translation) {
              target_id = 2
              show_content = work.translation
            } else if (work.appreciation) {
              target_id = 3
              show_content = work.appreciation
            } else if (work.master_comment) {
              target_id = 4
              show_content = work.master_comment
            }
            show_content = show_content.replace(/\n/g, "\n&emsp;&emsp;")
            show_content = show_content.replace(/\t/g, "\n&emsp;&emsp;")
            if (work.id % 2 == 0) {
              var url = config.neteaseAudioUrl
            } else {
              var url = config.songciAudioUrl
            }
            if (work.layout == 'indent') {
              work.content = work.content.replace(/\n/g, "\n&emsp;&emsp;")
              work.content = work.content.replace(/\t/g, "\n&emsp;&emsp;")
            }
            that.setData({
              songciItem: work,
              audioId: work.id,
              audioUrl: url +
              work.id + '.m4a',
              currentSongci: work.work_title + '-' + work.work_author,
              currentTab: target_id,
              show_content: show_content
            });
            wx.setStorage({
              key: 'songci' + key + util.formatTime(new Date()),
              data: that.data,
            })
          }
        });
      }
    });
    wx.getStorage({
      key: 'play_mode',
      success: function (res) {
        that.setData({
          mode: res.data ? res.data : 'xunhuan'
        });
      },
    })
    wx.getStorage({
      key: 'time2close',
      success: function (res) {
        that.setData({
          time2close: res.data && res.data > 0 ? res.data : 0
        });
      },
    })
    wx.getStorage({
      key: 'closeplaytime',
      success: function (res) {
        that.setData({
          closeplaytime: res.data && res.data > 0 ? res.data : 0
        });
      },
    })
  },
  do_operate_play: function (key, mode = "xunhuan") {
    var that = this
    var music_ids = wx.getStorageSync('music_ids')
    var play_id = 1
    var mode = this.data.mode
    if (mode == 'xunhuan') {
      var index = music_ids.indexOf(
        this.data.songciItem.id)
      //循环播放
      if (key == 'next') {
        if (index == music_ids.length - 1) {
          play_id = music_ids[0]
        } else {
          play_id = music_ids[index + 1]
        }
      } else {
        if (index == 0) {
          play_id = music_ids[music_ids.length - 1]
        } else {
          play_id = music_ids[index - 1]
        }
      }
    } else if (that.data.mode == 'one') {
      //单曲循环
      play_id = this.data.songciItem.id
    } else {
      //随机播放
      var music_ids = wx.getStorageSync('music_ids')
      var play_id = parseInt(music_ids.length * Math.random())
      if (play_id >= music_ids.length) {
        play_id = music_ids.length - 1
      }
      play_id = music_ids[play_id]
    }
    try {
      this.get_by_id(play_id)
      this.setData({
        duration_show: '',
        current_time_show: '',
        seek2: 0,
        slideValue: 0,
      });
      setTimeout(() => {
        that.playsound();
        that.record_play();
      }, 1000)
    } catch (e) {
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      })
    }
  },
  operate_play: function (e) {
    var key = e.target.dataset.key
    this.do_operate_play(key, this.data.mode)
  },
  operate_like: function (e) {
    var like = e.target.dataset.like
    var operate = like == 1 ? 'dislike' : 'like'
    var that = this
    wx.getStorage({
      key: 'user_open_id',
      success: function (res) {
        var open_id = res.data;
        var gsc_id = that.data.songciItem.id
        wx.request({
          url: config.service.host + '/user/' + operate + '/' + open_id + '/' + gsc_id,
          success: function (res) {
            if (!res || res.data.code != 0) {
              wx.showToast({
                title: '网络异常',
                icon: 'none'
              });
              return
            }
            wx.showToast({
              title: res.data.data,
              icon: 'none'
            });
            if (res.data.code == 0) {
              var songciItem = that.data.songciItem
              if (operate == 'like') {
                songciItem.like = 1
              } else {
                songciItem.like = 0
              }
              that.setData({
                songciItem: songciItem
              })
              wx.removeStorage({
                key: 'songci' + songciItem.id
              })
            }
          }
        })
      },
      fail: function () {
        wx.showToast({
          title: '请稍后再试',
          icon: 'none'
        });
        util.userLogin()
      }
    })
  },
  pauseplaybackmusic: function () {
    this.backgroundAudioManager.pause()
    var currentTime = 1
    if (this.backgroundAudioManager.currentTime && this.backgroundAudioManager.currentTime > 1) {
      currentTime = this.backgroundAudioManager.currentTime
    }
    this.setData({
      seek2: currentTime,
      slideValue: parseInt(currentTime / this.backgroundAudioManager.duration),
      playing: false
    });
  },
  playbackmusic: function (e) {
    var that = this
    if (that.data.playing) {
      that.pauseplaybackmusic()
    } else {
      that.playsound();
      that.record_play()
    }
  },
  record_play: function () {
    var that = this
    var historyplay = wx.getStorageSync('historyplay')
    if (!historyplay) {
      historyplay = {}
    }
    if (historyplay.hasOwnProperty(that.data.songciItem.id + '')) {
      that.data.songciItem.playtimes = historyplay[that.data.songciItem.id + ''].playtimes + 1
    } else {
      that.data.songciItem.playtimes = 1
    }
    historyplay[that.data.songciItem.id + ''] = that.data.songciItem
    wx.setStorageSync('historyplay', historyplay)
  },
  search_: function (e) {
    this.pauseplaybackmusic()
    var id_ = e.target.dataset.id_
    var q = e.target.dataset.q
    var pages = getCurrentPages()
    var url = '/pages/catalog/catalog?id=' + id_ + '&q=' + q
    if (pages.length == config.maxLayer) {
      util.pageConfirm(url)
    } else {
      wx.navigateTo({
        url: url
      });
    }
  },
  changeContent: function (e) {
    var target_id = e.target.dataset.item
    var gsc = this.data.songciItem
    var show_content = ''
    switch ('' + target_id) {
      case '0':
        show_content = gsc.intro
        break
      case '1':
        show_content = gsc.annotation
        break
      case '2':
        show_content = gsc.translation
        break
      case '3':
        show_content = gsc.appreciation
        break
      case '4':
        show_content = gsc.master_comment
        break
    }
    show_content = show_content.replace(/\n/g, "\n&emsp;&emsp;")
    show_content = show_content.replace(/\t/g, "\n&emsp;&emsp;")
    this.setData({
      currentTab: target_id,
      show_content: show_content
    })
  },
  onPullDownRefresh: function () {
    this.pauseplaybackmusic()
    wx.showNavigationBarLoading();
    var that = this
    if (parseInt(that.data.audioId) > 8099) {
      that.setData({
        audioId: 0,
      });
    }
    var key = parseInt(that.data.audioId) + 1
    that.get_by_id(key)
    wx.hideNavigationBarLoading()
    wx.stopPullDownRefresh()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    that.setData({
      seek2: 0
    })
    if (options.hasOwnProperty('id')) {
      that.setData({
        audioId: options.id
      })
    }
    util.showBusy('加载中', 20000)
    that.get_by_id(that.data.audioId)
    util.closeToast()
  },
  playsound: function () {
    const backgroundAudioManager = this.backgroundAudioManager
    backgroundAudioManager.title = this.data.songciItem.work_title
    backgroundAudioManager.epname = 'i古诗词'
    backgroundAudioManager.singer = this.data.songciItem.work_author
    backgroundAudioManager.coverImgUrl = 'http://a2.qpic.cn/psb?/V121Rqgy1YUsix/5XTZlkJ.N7a5wLN2X6xJypRkRbJH0Dy7THuk1HTKofQ!/b/dGEBAAAAAAAA&ek=1&kp=1&pt=0&bo=AAEAAQAAAAARFyA!&vuin=75124771&tm=1525960800&sce=60-1-1&rf=viewer_4'
    backgroundAudioManager.src = this.data.audioUrl
    backgroundAudioManager.startTime = this.data.seek2
    this.setData({
      playing: true
    });
    backgroundAudioManager.play()
    backgroundAudioManager.seek(this.data.seek2)
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function (e) {
    var that = this
    this.backgroundAudioManager = wx.getBackgroundAudioManager();
    try {
      var mode = wx.getStorageSync('play_mode')
      that.setData({
        mode: mode ? mode : "xunhuan"
      })
    } catch (e) {
      mode = 'xunhuan'
    }
    try {
      var time2close = wx.getStorageSync('time2close')
      var closeplaytime = wx.getStorageSync('closeplaytime')
      if (time2close && time2close * 1000 > (new Date).getTime()) {
        that.setData({
          time2close: time2close,
          closeplaytime: closeplaytime
        })
      } else {
        that.setData({
          time2close: 0,
          closeplaytime: 0
        })
        wx.removeStorageSync('time2close')
        wx.removeStorageSync('closeplaytime')
      }
    } catch (e) {
    }
    this.backgroundAudioManager.onEnded(() => {
      that.do_operate_play('next', mode)
    });
    this.backgroundAudioManager.onStop(() => {
      that.record_play();
      that.playsound();
    });
    this.backgroundAudioManager.onError((e) => {
      that.setData({
        playing: false
      })
      wx.showToast({
        title: '播放失败',
        icon: 'none'
      });
    });
    this.backgroundAudioManager.onWaiting(() => {
      wx.showLoading({
        title: '音频加载中...',
      });
    });
    this.backgroundAudioManager.onCanplay(() => {
      wx.hideLoading();
    });
    this.backgroundAudioManager.onPlay(() => {
      wx.hideLoading();
    });
    this.backgroundAudioManager.onPrev(() => {
      that.do_operate_play('up', mode)
    });

    this.backgroundAudioManager.onNext(() => {
      that.do_operate_play('next', mode)
    });
    this.backgroundAudioManager.onTimeUpdate(() => {
      that.musicStart()
    });
    this.get_music_list()
  },
  get_music_list: function () {
    if (this.data.songciItem && this.data.songciItem.audio_id > 0) {
      var value = "音频"
      var key = 'search_音频' + util.formatTime(new Date())
      wx.getStorage({
        key: key,
        success: function (res) {
          if (res && res.data) {
            var data = res.data
            var music_ids = []
            for (var index = 0; index < data.length; index++) {
              music_ids.push(data[index].id)
            }
            wx.setStorageSync('music_ids', music_ids)
          }
        },
        fail: function () {
          wx.request({
            url: config.songciUrl + 'query/' + value,
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
    }
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      seek2: 0
    });
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
  longPress: function () {
    var that = this
    that.pauseplaybackmusic()
    if (parseInt(that.data.audioId) <= 1) {
      that.setData({
        audioId: 8101
      });
    }
    util.showBusy('加载中')
    var key = parseInt(that.data.audioId) - 1
    that.get_by_id(key)
  },

  onShareAppMessage: function (res) {
    return {
      title: this.data.currentSongci,
      path: '/pages/songci/songci?id=' + this.data.audioId,
      imageUrl: '/static/share0.jpeg',
      success: function (res) {
        util.showSuccess('分享成功')
      },
      fail: function (res) {
        util.showSuccess('取消分享')
      }
    }
  },
  longPressBack: function () {
    this.pauseplaybackmusic()
    wx.redirectTo({
      url: '/pages/catalog/catalog',
    })
  },
  musicStart: function () {
    var that = this
    try {
      var time2close = wx.getStorageSync('time2close')
      if (time2close && (new Date().getTime()) > time2close * 1000) {
        that.pauseplaybackmusic()
        that.setdata({
          time2close: 0,
          closeplaytime: 0,
          playing: false,
          duration_show: '',
          current_time_show: '',
          seek2: 0,
          slideValue: 0,
        })
        wx.showToast({
          title: '播放器已关闭',
          icon: 'none'
        })
        wx.removeStorageSync('time2close')
        wx.removeStorageSync('closeplaytime')
        return
      }
    } catch (e) { }
    var current_time = this.backgroundAudioManager.currentTime
    var duration = this.backgroundAudioManager.duration
    this.setData({
      slideValue: parseInt(current_time / duration * 100)
    })
    var current_time_show = (parseInt(current_time / 60) < 10 ? '0' + parseInt(current_time / 60) : parseInt(current_time / 60)) + ':' + ((parseInt(current_time % 60) > 9) ? parseInt(current_time % 60) : '0' + parseInt(current_time % 60))
    var duration_show = (parseInt(duration / 60) < 10 ? '0' + parseInt(duration / 60) : parseInt(duration / 60)) + ':' + ((parseInt(duration % 60) > 9) ? parseInt(duration % 60) : '0' + parseInt(duration % 60))
    that.setData({
      duration: this.backgroundAudioManager.duration,
      current_time: this.backgroundAudioManager.currentTime,
      duration_show: duration_show,
      current_time_show: current_time_show
    })
  },
  sliderChanging: function (e) {
    var that = this
    var current_time = e.detail.value / 100.0 * that.backgroundAudioManager.duration
    if (!that.backgroundAudioManager.paused) {
      that.backgroundAudioManager.pause()
    }
    if (that.backgroundAudioManager.buffered < current_time) {
      wx.showLoading({
        title: '音频加载中',
      });
    }
    var current_time_show = (parseInt(current_time / 60) < 10 ? '0' + parseInt(current_time / 60) : parseInt(current_time / 60)) + ':' + ((parseInt(current_time % 60) > 9) ? parseInt(current_time % 60) : '0' + parseInt(current_time % 60))
    that.setData({
      current_time_show: current_time_show,
      seek2: current_time
    })
  },
  slider2change: function (e) {
    var that = this
    var v = e.detail.value
    var duration = that.backgroundAudioManager.duration ? that.backgroundAudioManager.duration : 0
    that.backgroundAudioManager.pause()
    var seek2 = v / 100 * duration
    that.setData({
      seek2: seek2 >= duration ? 0 : seek2
    });
    setTimeout(() => {
      that.playsound()
    }, 800)
  }
});