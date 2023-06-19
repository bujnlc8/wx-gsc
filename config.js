const host = "https://example.com";
// const host = 'http://127.0.0.1:8080'
const config = {
  service: {
    host,
  },
  poster: "https://example.com/igsc/cover${num}.png?t=20230616",
  gsc_url: `${host}/gsc/`,
  qaudio_url: "https://example.com/songci-audio/",
  max_layer: 10, //最多10层页面
};
const background_audio_manager = wx.getBackgroundAudioManager();
background_audio_manager.referrerPolicy = "origin";

const systemInfo = wx.getSystemInfoSync();

export { config, background_audio_manager, systemInfo };
