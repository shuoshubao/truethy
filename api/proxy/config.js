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
    },
    // TinyPNG / TinyJPG 图片压缩
    tinify: {
        target: 'https://api.tinify.com',
        withCredentials: false
    },
    // 腾讯云 TokenHub 大模型服务平台（按量计费，OpenAI / Anthropic 兼容）
    tokenhub: {
        target: 'https://tokenhub.tencentcloudmaas.com',
        withCredentials: false,
        // 模型推理 / 流式响应较慢，放宽到 5 分钟
        timeout: 300
    },
    // 腾讯云 TokenHub 个人 Token Plan 套餐（OpenAI 兼容）
    tokenplan: {
        target: 'https://tokenhub.tencentmaas.com',
        withCredentials: false,
        timeout: 300
    }
};
