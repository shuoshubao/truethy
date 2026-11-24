## 本地运行

安装依赖:

```sh
npm install
```

百度网盘 OAuth 接口需要配置应用凭据. 复制环境变量模板, 并在 `.env.local` 中填写自己的值:

```sh
cp .env.example .env.local
```

需要填写的变量:

| 变量名 | 说明 |
| --- | --- |
| `BAIDU_PAN_APP_KEY` | 百度网盘 OAuth 应用的 App Key |
| `BAIDU_PAN_SECRET_KEY` | 百度网盘 OAuth 应用的 Secret Key |

`.env.local` 已被 Git 忽略, 不要提交真实凭据. 部署到 Vercel 时, 在项目设置中配置相同的环境变量.

启动本地服务:

```sh
npm start
```

前端开发服务器:

```sh
npm run dev
```
