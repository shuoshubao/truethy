import crypto from 'crypto';

const HOST = 'tokenhub.tencentcloudapi.com';
const ENDPOINT = `https://${HOST}/`;
const SERVICE = 'tokenhub';
const ACTION = 'DescribeUsageRankList';
const VERSION = '2026-03-22';
const REGION = 'ap-guangzhou';

const sha256 = value => crypto.createHash('sha256').update(value).digest();
const hmac = (key, value) => crypto.createHmac('sha256', key).update(value).digest();

// 腾讯云 TC3-HMAC-SHA256 签名
const buildAuthorization = (secretId, secretKey, timestamp, payload) => {
    const date = new Date(timestamp * 1000).toISOString().slice(0, 10);
    const credentialScope = `${date}/${SERVICE}/tc3_request`;
    const signedHeaders = 'content-type;host';
    const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${HOST}\n`;
    const canonicalRequest = ['POST', '/', '', canonicalHeaders, signedHeaders, sha256(payload).toString('hex')].join('\n');
    const stringToSign = ['TC3-HMAC-SHA256', timestamp, credentialScope, sha256(canonicalRequest).toString('hex')].join('\n');
    const secretDate = hmac(`TC3${secretKey}`, date);
    const secretService = hmac(secretDate, SERVICE);
    const secretSigning = hmac(secretService, 'tc3_request');
    const signature = hmac(secretSigning, stringToSign).toString('hex');
    return `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
};

const pad = value => String(value).padStart(2, '0');

// 北京时间当月 1 号到当前时刻, RFC3339 格式
const defaultRange = () => {
    const now = new Date(Date.now() + 8 * 3600 * 1000);
    const start = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-01T00:00:00+08:00`;
    const end = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}T${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}+08:00`;
    return { start, end };
};

export const getTokenHubUsage = {
    url: '/api/tokenhub-usage',
    method: 'post',
    middleware: async ctx => {
        const started = Date.now();
        const { secretId, secretKey, startTime, endTime, target, dimension = 'apikey' } = ctx.request.body || {};
        if (!secretId || !secretKey) {
            ctx.status = 400;
            ctx.body = { code: 1, message: '缺少 SecretId 或 SecretKey', time: Date.now() - started, data: null };
            return;
        }
        const fallback = defaultRange();
        const params = {
            Dimension: dimension,
            StartTime: startTime || fallback.start,
            EndTime: endTime || fallback.end,
            MetricType: 'tokens',
            ShowAll: true
        };
        if (target) {
            params.Target = target;
        }
        const payload = JSON.stringify(params);
        const timestamp = Math.floor(Date.now() / 1000);
        try {
            const response = await fetch(ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    Host: HOST,
                    Authorization: buildAuthorization(secretId, secretKey, timestamp, payload),
                    'X-TC-Action': ACTION,
                    'X-TC-Timestamp': String(timestamp),
                    'X-TC-Version': VERSION,
                    'X-TC-Region': REGION
                },
                body: payload
            });
            const result = await response.json();
            const error = result?.Response?.Error;
            if (error) {
                ctx.status = 400;
                ctx.body = { code: 1, message: `${error.Code}: ${error.Message}`, time: Date.now() - started, data: null };
                return;
            }
            ctx.body = {
                code: 0,
                message: '',
                time: Date.now() - started,
                data: {
                    startTime: result.Response.StartTime,
                    endTime: result.Response.EndTime,
                    totalStats: result.Response.TotalStats || {},
                    topList: result.Response.TopList || []
                }
            };
        } catch (e) {
            ctx.status = 502;
            ctx.body = { code: 1, message: e.message || '查询用量失败', time: Date.now() - started, data: null };
        }
    }
};
