import crypto from 'crypto';

const Host = 'tokenhub.tencentcloudapi.com';
const Endpoint = `https://${Host}/`;
const Service = 'tokenhub';
const Version = '2026-03-22';
const Region = 'ap-guangzhou';

const sha256 = value => crypto.createHash('sha256').update(value).digest();
const hmac = (key, value) => crypto.createHmac('sha256', key).update(value).digest();

// 腾讯云 TC3-HMAC-SHA256 签名
const buildAuthorization = (secretId, secretKey, timestamp, payload) => {
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const credentialScope = `${date}/${Service}/tc3_request`;
    const signedHeaders = 'content-type;host';
    const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${Host}\n`;
    const canonicalRequest = ['POST', '/', '', canonicalHeaders, signedHeaders, sha256(payload).toString('hex')].join('\n');
    const stringToSign = ['TC3-HMAC-SHA256', timestamp, credentialScope, sha256(canonicalRequest).toString('hex')].join('\n');
    const secretDate = hmac(`TC3${secretKey}`, date);
    const secretService = hmac(secretDate, Service);
    const secretSigning = hmac(secretService, 'tc3_request');
    const signature = hmac(secretSigning, stringToSign).toString('hex');
    return `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
};

const callTokenHub = async (action, params, secretId, secretKey) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify(params);
    const response = await fetch(Endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            Host,
            Authorization: buildAuthorization(secretId, secretKey, timestamp, payload),
            'X-TC-Action': action,
            'X-TC-Timestamp': String(timestamp),
            'X-TC-Version': Version,
            'X-TC-Region': Region
        },
        body: payload
    });
    const result = await response.json();
    return result.Response;
};

export const PostTokenHub = {
    url: '/api/tokenhub',
    method: 'post',
    middleware: async ctx => {
        const started = Date.now();
        const { action, params, secretId, secretKey } = ctx.request.body || {};
        if (!secretId || !secretKey) {
            ctx.status = 400;
            ctx.body = { code: 1, message: '缺少 SecretId 或 SecretKey', time: Date.now() - started, data: null };
            return;
        }
        if (!action) {
            ctx.status = 400;
            ctx.body = { code: 1, message: '缺少 Action', time: Date.now() - started, data: null };
            return;
        }
        try {
            const result = await callTokenHub(action, params || {}, secretId, secretKey);
            ctx.body = { code: 0, message: '', time: Date.now() - started, data: result };
        } catch (e) {
            ctx.status = 502;
            ctx.body = { code: 1, message: e.message || 'TokenHub 请求失败', time: Date.now() - started, data: null };
        }
    }
};
