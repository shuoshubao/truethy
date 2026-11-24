# truethy

## 项目简介

部署在 Vercel 的在线工具站，域名 https://truethy.vercel.app/ 。基于 Koa + Vercel Serverless Functions，把开发常用的在线编译、图片生成、请求代理、模拟数据接口集中在一个服务里，同时作为 `english-word`（网页版）和 `english-mini`（小程序）的服务端代理。

## 技术栈

- Node.js，ES Module（`package.json` 中 `"type": "module"`），用 `import` / `export`，不写 `require`
- Koa + `@koa/router` + `@koa/bodyparser` + `@koa/cors`，接口在 `api/` 下按模块拆分
- 部署走 Vercel（`vercel.json`）：`index.js` 由 `@vercel/node` 托管，`package.json` 由 `@vercel/static-build` 构建静态资源到 `dist/`
- 本地：`node index.js` 起在 3000 端口；`npm start` 用 `vercel dev`

## 目录结构

```
index.js               Koa 入口，加载 api/index.js 导出的所有路由
vercel.json            部署配置（builds + routes）
api/
  index.js             汇总导出所有接口处理器
  env.js               查看运行环境与文件清单
  image.js             二维码 / 占位图 / 随机头像
  logs.js              表格模拟数据
  compiler/            babel / esbuild / less / prettier / sass 在线编译
  proxy/
    config.js          通用转发的域名映射表
    index.js           通用转发 + 百度 dlink 下载代理
    pan.js             百度网盘 OAuth（从环境变量读取密钥，不下发浏览器）
public/                 不经过构建的静态文件（如 ganlusi.html）
dist/                   Vite 构建产物，已 gitignore（首页 index.html 构建后落在这里）
```

## 接口约定

每个接口模块导出形如 `{ url, method, middleware }` 的常量，由 `api/index.js` 汇总，`index.js` 遍历注册到 Koa Router。新增接口只需在 `api/` 下建模块并在 `api/index.js` 加一行导出。

- 成功响应统一 `{ code: 0, message: '', time, data }`，失败 `code: 1` 且 `data` 为 `null`
- 图片接口直接返回 PNG Buffer 并设 `Content-Type: image/png`
- 通用转发路由 `/proxy/:target/(.*)`：`target` 必须在 `proxy/config.js` 的 `proxyConfig` 里登记，未在表中登记的一律 404

### 接口一览

| 路径 | 方法 | 说明 |
| --- | --- | --- |
| `/api/qrcode` | GET | 二维码，`text` 参数，缺省随机 |
| `/api/placeholder` | GET | 占位图，支持 width / height / color / bgcolor / fontSize |
| `/api/avatar/:name` | GET | 按名字生成确定性随机头像 |
| `/api/logs/table/:total` | GET | 表格分页模拟数据 |
| `/api/env` | GET | 当前环境变量与文件清单 |
| `/api/compiler/{babel,esbuild,less,prettier,sass}` | POST | 在线编译，`{ code, config? }` |
| `/proxy/dl` | GET | 跟随百度 dlink 的 302 下载文件（仅允许百度域名） |
| `/proxy/pan-auth-url` | GET | 生成百度网盘授权 URL，client_id 由服务端补 |
| `/proxy/pan-token` | POST | 换取 / 刷新百度网盘 token，client_secret 由服务端补 |
| `/proxy/:target/(.*)` | ALL | 通用域名转发，见 `proxy/config.js` |

## 注意事项

- 百度网盘 AppKey / SecretKey 通过 `BAIDU_PAN_APP_KEY` 和 `BAIDU_PAN_SECRET_KEY` 环境变量配置；本地可参考 `.env.example` 创建 `.env.local`。前端只持有用户自己的 access_token / refresh_token，不接触应用密钥。
- `api/proxy/pan.js` 的路由导出放在 `proxy/index.js` 之前，避免 `/proxy/pan-*` 被通用通配路由 `/proxy/:target/(.*)` 抢占。
- 部署到 Vercel 后接口自动生效；本地新增环境变量后需同步到 Vercel 的服务设置里。
