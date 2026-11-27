# truethy

## 项目简介

部署在 Vercel 的接口代理与转发服务，域名 https://truethy.vercel.app/ 。基于 Koa + Vercel Serverless Functions，为 `english-word`（网页版）、`english-mini`（小程序）、`dev-kit` 等前端项目提供跨域代理、百度网盘 OAuth、TokenHub 用量查询。首页 `GET /` 返回 hello world。

## 技术栈

- Node.js，ES Module（`package.json` 中 `"type": "module"`），用 `import` / `export`，不写 `require`
- Koa + `@koa/router` + `@koa/bodyparser` + `@koa/cors`
- 部署走 Vercel（`vercel.json`）：`index.js` 由 `@vercel/node` 托管，所有路径都转发给它
- 本地：`npm start` 起在 3000 端口；`npm run dev` 用 `vercel dev`

## 代码规范

编写或修改代码时严格遵守以下规则:

1. **语法**: 使用最新语法特性, 无需兼容旧版本运行时.
2. **命名**: 统一使用驼峰风格. 变量, 函数, 参数, 属性等用小驼峰 (`camelCase`), 常量用大驼峰 (`PascalCase`). 禁止 snake_case, kebab-case, 全大写下划线等其他风格.
3. **符号**: 所有标点使用英文半角符号, 禁止中文标点; 字符串内容和注释同样适用.

## 目录结构

```
index.js              Koa 入口，首页路由 + 加载 api/index.js 导出的所有路由
vercel.json           部署配置（单 build + 通配 route）
api/
  index.js            汇总导出所有接口处理器
  tokenhub-usage.js   TokenHub 用量查询（服务端签名调腾讯云管控面 API）
  proxy/
    config.js         通用转发的域名映射表
    index.js          通用转发 + 百度 dlink 下载代理
    pan.js            百度网盘 OAuth（从环境变量读取密钥，不下发浏览器）
```

## 接口约定

每个接口模块导出形如 `{ url, method, middleware }` 的常量，由 `api/index.js` 汇总，`index.js` 遍历注册到 Koa Router。新增接口只需在 `api/` 下建模块并在 `api/index.js` 加一行导出。

- 通用转发路由 `/:target/(.*)`：`target` 必须在 `proxy/config.js` 的 `proxyConfig` 里登记，未在表中登记的一律 404
- 具体路由（`/dl`、`/pan-*`、`/api/tokenhub-usage`）在 `api/index.js` 里排在 `proxy/index.js` 之前，避免被通配路由抢占

### 接口一览

| 路径                  | 方法 | 说明                                                         |
| --------------------- | ---- | ------------------------------------------------------------ |
| `/`                   | GET  | 首页，返回 hello world                                       |
| `/api/tokenhub-usage` | POST | 查询 TokenHub 账号本月 token 用量，`{ secretId, secretKey }` |
| `/dl`                 | GET  | 跟随百度 dlink 的 302 下载文件（仅允许百度域名）             |
| `/pan-auth-url`       | GET  | 生成百度网盘授权 URL，client_id 由服务端补                   |
| `/pan-token`          | POST | 换取 / 刷新百度网盘 token，client_secret 由服务端补          |
| `/tinify/(.*)`        | ALL  | TinyPNG 图片压缩转发，如 `/shrink`、`/output/:id`            |
| `/:target/(.*)`       | ALL  | 通用域名转发，见 `proxy/config.js`                           |

## 注意事项

- 百度网盘 AppKey / SecretKey 通过 `BAIDU_PAN_APP_KEY` 和 `BAIDU_PAN_SECRET_KEY` 环境变量配置；本地可参考 `.env.example` 创建 `.env.local`。前端只持有用户自己的 access_token / refresh_token，不接触应用密钥。
- `api/proxy/pan.js` 的路由导出放在 `proxy/index.js` 之前，避免 `/pan-*` 被通用通配路由 `/:target/(.*)` 抢占。
- TinyPNG 压缩结果从 201 响应的 `output.url` 取，下载 / resize / convert 走 `/tinify/output/:id`（output.url 有效期 8 小时）。
- TokenHub 用量查询走腾讯云管控面 `DescribeUsageRankList`，SecretId / SecretKey 由调用方在请求体里临时传入，服务端签名后即丢弃，不落盘、不读环境变量。
- 部署到 Vercel 后接口自动生效；本地新增环境变量后需同步到 Vercel 的服务设置里。
