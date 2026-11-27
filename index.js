import { bodyParser } from '@koa/bodyparser';
import cors from '@koa/cors';
import Router from '@koa/router';
import Koa from 'koa';
import os from 'os';
import * as apis from './api/index.js';

const app = new Koa();

app.use(cors());
app.use(bodyParser());

const router = new Router();

router.get('/', ctx => {
    ctx.type = 'html';
    ctx.body = '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><title>truethy</title></head><body>hello world</body></html>';
});

Object.values(apis).forEach(item => {
    const { url, method, middleware } = item;
    router[method](url, middleware);
});

app.use(router.routes());
app.use(router.allowedMethods());

if (os.platform() === 'darwin' && !process.env.__VERCEL_DEV_RUNNING) {
    app.listen(3000);
}

export default app.callback();
