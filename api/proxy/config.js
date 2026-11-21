// 接口转发配置
export const proxyConfig = {
    fanyi: {
        target: 'https://fanyi.baidu.com',
        // 是否透传 set-cookie / cookie 等
        withCredentials: false
    },
    youdao: {
        target: 'https://dict.youdao.com',
        withCredentials: false
    },
    // 百度网盘开放平台
    baidupan: {
        target: 'https://pan.baidu.com',
        withCredentials: false
    },
    baiduopen: {
        target: 'https://openapi.baidu.com',
        withCredentials: false
    },
    baiduupload: {
        target: 'https://d.pcs.baidu.com',
        withCredentials: false
    },
    // 百度智能云语音合成: token 换取 + 音频合成
    aip: {
        target: 'https://aip.baidubce.com',
        withCredentials: false
    },
    bdaitts: {
        target: 'https://tsn.baidu.com',
        withCredentials: false
    },
    // 豆包(火山引擎)语音合成
    doubaotts: {
        target: 'https://openspeech.bytedance.com',
        withCredentials: false
    }
};
