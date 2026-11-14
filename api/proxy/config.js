// 接口转发配置
export const proxyConfig = {
    fanyi: {
        target: 'https://fanyi.baidu.com',
        // 是否透传 set-cookie / cookie 等
        withCredentials: false
    }
};
