# truethy

本项目仅提供 HTTP 接口转发与代理，用于解决浏览器跨域访问限制。所有请求实时透传至目标服务器，平台不缓存、不记录、不存储任何请求内容、参数及用户数据。

如经本服务转发的内容违反相关法律法规，服务提供方愿承担相应法律责任。

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

| 变量名                 | 说明                             |
| ---------------------- | -------------------------------- |
| `BAIDU_PAN_APP_KEY`    | 百度网盘 OAuth 应用的 App Key    |
| `BAIDU_PAN_SECRET_KEY` | 百度网盘 OAuth 应用的 Secret Key |

`.env.local` 已被 Git 忽略, 不要提交真实凭据. 部署到 Vercel 时, 在项目设置中配置相同的环境变量.

启动本地服务:

```sh
npm start
```

用 Vercel 本地开发环境启动:

```sh
npm run dev
```

## 接口

| 路径前缀        | 目标域名                           | 说明               |
| --------------- | ---------------------------------- | ------------------ |
| `/fanyi/`       | `https://fanyi.baidu.com`          | 百度翻译           |
| `/youdao/`      | `https://dict.youdao.com`          | 有道词典发音       |
| `/baidupan/`    | `https://pan.baidu.com`            | 百度网盘开放平台   |
| `/baiduopen/`   | `https://openapi.baidu.com`        | 百度开放平台       |
| `/baiduupload/` | `https://d.pcs.baidu.com`          | 百度网盘上传       |
| `/aip/`         | `https://aip.baidubce.com`         | 百度智能云语音合成 |
| `/bdaitts/`     | `https://tsn.baidu.com`            | 百度语音合成       |
| `/doubaotts/`   | `https://openspeech.bytedance.com` | 豆包语音合成       |
| `/tinify/`      | `https://api.tinify.com`           | TinyPNG 图片压缩   |
| `/tokenhub/`    | `https://tokenhub.tencentmaas.com` | TokenHub 按量版    |
| `/tokenplan/`   | `https://tokenhub.tencentmaas.com` | TokenHub 个人版    |
