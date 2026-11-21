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
    }
};
