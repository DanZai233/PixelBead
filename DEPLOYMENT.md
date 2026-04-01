# Pixel Bead Studio - Vercel 部署指南

## 一键部署到 Vercel

### 方式一：通过 Vercel 部署按钮（推荐）

1. 点击仓库 README 中的 "Deploy with Vercel" 按钮
2. 授权 Vercel 访问你的 GitHub 账户
3. 导入此项目并配置环境变量（见下文）
4. 点击 "Deploy"

### 方式二：通过 Vercel CLI

```bash
npm install
npm run build
npx vercel login
npx vercel
```

## 环境变量配置

在 **Vercel 项目 → Settings → Environment Variables** 中配置：

### 智能生成拼豆图（服务端 `/api/ai/generate-image`）

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `PIXELBEAD_AI_API_KEY` | 是 | 图像生成接口 Bearer Token |
| `PIXELBEAD_AI_API_BASE` | 否 | 图像生成 API 根路径（可选，有服务端默认值） |
| `PIXELBEAD_AI_IMAGE_MODEL` | 否 | 模型 ID（可选，有服务端默认值） |

### 其他已有功能

- `MONGODB_URI` — 素材广场
- `VITE_UPSTASH_REDIS_REST_URL` / `VITE_UPSTASH_REDIS_REST_TOKEN` — 分享链接（构建时注入前端）

> 请勿使用 `VITE_` 前缀暴露图像生成密钥到浏览器。

## 功能特性摘要

- 画布编辑、色号系统、导出、分享、素材广场
- **智能生成**：用户免费使用，由上述服务端环境变量启用
- 本地「图片转拼豆」在浏览器内处理，不依赖智能生成接口

## 本地开发

```bash
npm install
npm run dev
```

纯前端开发时，`/api/ai/generate-image` 在本地不存在；可运行 `npx vercel dev` 联调，或设置 `VITE_AI_GENERATE_URL` 指向已部署站点。

## 技术栈

- React 19 + TypeScript + Vite 6
- Vercel Serverless（`api/` 目录）

## 许可证

见仓库 LICENSE
