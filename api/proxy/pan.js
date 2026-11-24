// 百度网盘 OAuth: AppKey / SecretKey 从环境变量读取, 不下发浏览器
const APP_KEY = process.env.BAIDU_PAN_APP_KEY;
const SECRET_KEY = process.env.BAIDU_PAN_SECRET_KEY;
const AUTHORIZE_URL = 'https://openapi.baidu.com/oauth/2.0/authorize';
const TOKEN_URL = 'https://openapi.baidu.com/oauth/2.0/token';

// 授权页 URL: client_id 由服务端补, oob 本地复制授权码, 其余走标准回调
export const panAuthUrlHandler = {
    url: '/proxy/pan-auth-url',
    method: 'get',
    middleware: async ctx => {
        const oob = ctx.query.oob === '1';
        const redirectUri = oob ? 'oob' : String(ctx.query.redirect_uri ?? '');
        const state = String(ctx.query.state ?? '');
        if (!oob && !redirectUri) {
            ctx.status = 400;
            ctx.body = { error: 'missing redirect_uri' };
            return;
        }
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: APP_KEY,
            scope: 'basic,netdisk',
            display: 'page',
            redirect_uri: redirectUri
        });
        if (state) {
            params.set('state', state);
        }
        ctx.body = { url: `${AUTHORIZE_URL}?${params}` };
    }
};

// 换取 / 刷新 token: client_id + client_secret 由服务端补
export const panTokenHandler = {
    url: '/proxy/pan-token',
    method: 'post',
    middleware: async ctx => {
        const body = ctx.request.body ?? {};
        const grantType = String(body.grant_type ?? '');
        const params = {
            grant_type: grantType,
            client_id: APP_KEY,
            client_secret: SECRET_KEY
        };
        if (grantType === 'authorization_code') {
            params.code = String(body.code ?? '');
            params.redirect_uri = String(body.redirect_uri ?? 'oob');
        } else if (grantType === 'refresh_token') {
            params.refresh_token = String(body.refresh_token ?? '');
        } else {
            ctx.status = 400;
            ctx.body = { error: 'invalid grant_type' };
            return;
        }
        try {
            const response = await fetch(TOKEN_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams(params)
            });
            ctx.status = response.status;
            ctx.body = await response.json();
        } catch (error) {
            ctx.status = 502;
            ctx.body = { error: error.message };
        }
    }
};
