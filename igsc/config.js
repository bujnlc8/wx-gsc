var host = 'https://igsc.wx.haihui.site';
//var host = 'http://127.0.0.1:9090';
var config = {

    // 下面的地址配合云端 Demo 工作
    service: {
        host,

        // 登录地址，用于建立会话
        loginUrl: `${host}/weapp/login`,

        // 测试的请求地址，用于测试会话
        requestUrl: `${host}/weapp/user`,

        // 测试的信道服务地址
        tunnelUrl: `${host}/weapp/tunnel`,

        // 上传图片接口
        uploadUrl: `${host}/weapp/upload`,
    },
    // 宋词接口
    songciUrl: `${host}/songci/`,
    songciAudioUrl: 'https://qcloudtest-1256650966.cos.ap-guangzhou.myqcloud.com/songci-audio/',
    neteaseAudioUrl: 'https://songci.nos-eastchina1.126.net/audio/',
    maxLayer: 10, //最多10层页面
};

module.exports = config;
