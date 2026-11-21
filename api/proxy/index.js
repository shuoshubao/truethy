import http from 'http';
import https from 'https';
import { URL } from 'url';
import { proxyConfig } from './config.js';

// 需要透传到目标服务的请求头
const FORWARD_REQUEST_HEADERS = ['accept', 'accept-language', 'authorization', 'user-agent', 'content-type', 'content-length'];

// 从目标服务转发回来的响应头
const FORWARD_RESPONSE_HEADERS = ['content-type', 'content-length', 'content-disposition', 'cache-control', 'expires', 'last-modified', 'etag'];

const getClient = url => (url.protocol === 'https:' ? https : http);

/**
 * 组装目标 URL: 去掉 `/proxy/<targetKey>` 前缀后拼到 target 上
 */
const buildTargetUrl = (target, restPath, query) => {
    const url = new URL(target);
    const rest = restPath ? `/${restPath}`.replace(/\/+/g, '/') : '';
    url.pathname = `${url.pathname.replace(/\/$/, '')}${rest}` || '/';
    if (query) {
        url.search = query;
    }
    return url;
};

// 百度 dlink 会 302 到 CDN 域名(无 CORS 头), 由服务端 fetch 跟随重定向后返回内容
export const downloadHandler = {
    url: '/proxy/dl',
    method: 'get',
    middleware: async ctx => {
        const target = ctx.query.url;
        if (!target) {
            ctx.status = 400;
            ctx.body = 'missing url';
            return;
        }
        try {
            const host = new URL(target).hostname;
            if (!/(^|\.)baidu(pcs)?\.com$/.test(host)) {
                ctx.status = 403;
                ctx.body = 'host not allowed';
                return;
            }
            const upstream = await fetch(target);
            const buf = Buffer.from(await upstream.arrayBuffer());
            ctx.status = upstream.status;
            ctx.set('Content-Type', upstream.headers.get('content-type') || 'application/json');
            ctx.body = buf;
        } catch (e) {
            ctx.status = 502;
            ctx.body = e.message;
        }
    }
};

export const proxyHandler = {
    url: '/proxy/:target/(.*)',
    method: 'all',
    middleware: async ctx => {
        const { target: targetKey } = ctx.params;
        const restPath = ctx.params[0] || '';
        const config = proxyConfig[targetKey];

        if (!config) {
            ctx.status = 404;
            ctx.body = { code: 404, message: `target "${targetKey}" not found` };
            return;
        }

        const targetUrl = buildTargetUrl(config.target, restPath, ctx.querystring);
        const client = getClient(targetUrl);

        // 透传请求头
        const headers = {};
        FORWARD_REQUEST_HEADERS.forEach(name => {
            if (ctx.request.headers[name]) {
                headers[name] = ctx.request.headers[name];
            }
        });
        if (config.withCredentials && ctx.request.headers.cookie) {
            headers.cookie = ctx.request.headers.cookie;
        }

        // 透传请求体（GET/HEAD 无 body）
        const hasBody = !['GET', 'HEAD'].includes(ctx.request.method);
        let body;
        if (hasBody) {
            const parsed = ctx.request.body;
            const contentType = String(ctx.request.headers['content-type'] || '');
            // bodyParser 已解析的 urlencoded / json: 原始流已被读走, 需重新序列化
            if (parsed && typeof parsed === 'object' && !Buffer.isBuffer(parsed) && Object.keys(parsed).length) {
                if (contentType.includes('application/json')) {
                    body = JSON.stringify(parsed);
                } else {
                    body = new URLSearchParams(parsed).toString();
                }
                headers['content-length'] = Buffer.byteLength(body);
            } else {
                // multipart 等未被 bodyParser 处理的: 直接透传原始流
                body = ctx.req;
                if (ctx.request.headers['content-length']) {
                    headers['content-length'] = ctx.request.headers['content-length'];
                }
            }
        }

        const result = await new Promise((resolve, reject) => {
            const proxyReq = client.request(
                targetUrl,
                {
                    method: ctx.request.method,
                    headers
                },
                proxyRes => {
                    resolve({ proxyRes });
                }
            );

            proxyReq.on('error', reject);

            proxyReq.setTimeout(30 * 1000, () => proxyReq.destroy());

            if (Buffer.isBuffer(body) || typeof body === 'string') {
                proxyReq.end(body);
            } else if (body) {
                body.pipe(proxyReq);
            } else {
                proxyReq.end();
            }
        });

        const { proxyRes } = result;

        // 透传状态码
        ctx.status = proxyRes.statusCode;

        // 透传响应头（Content-Type 等在下方单独处理，避免覆盖）
        FORWARD_RESPONSE_HEADERS.forEach(name => {
            const value = proxyRes.headers[name];
            if (value) {
                ctx.set(name, value);
            }
        });

        // 如需要，透传 set-cookie
        if (config.withCredentials && proxyRes.headers['set-cookie']) {
            ctx.set('set-cookie', proxyRes.headers['set-cookie']);
        }

        // CORS
        const origin = ctx.request.headers.origin;
        if (origin) {
            ctx.set('Access-Control-Allow-Origin', origin);
            ctx.set('Access-Control-Allow-Credentials', 'true');
            ctx.set('Vary', 'Origin');
        }

        // 流式返回响应体
        ctx.body = proxyRes;
    }
};