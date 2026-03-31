# Pixel Bead Studio - Vercel 部署指南

## 一键部署到 Vercel

### 方式一：通过 Vercel 部署按钮（推荐）

1. 点击下方的 "Deploy" 按钮
2. 授权 Vercel 访问你的 GitHub 账户
3. 导入此项目
4. 点击 "Deploy" 即可

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### 方式二：通过 Vercel CLI 部署

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 登录 Vercel
npx vercel login

# 4. 部署
npx vercel
```

## 环境变量配置

在 Vercel 项目设置中，你可以配置以下环境变量（可选）：

- `OPENROUTER_API_KEY` - OpenRouter API 密钥
- `OPENROUTER_BASE_URL` - OpenRouter 基础 URL（默认: https://openrouter.ai/api/v1）
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥
- `VOLCENGINE_API_KEY` - 火山引擎 API 密钥
- `GEMINI_API_KEY` - Google Gemini API 密钥

> **注意**：当前版本支持用户在应用内配置自己的 API Key，无需配置环境变量。

## 功能特性

### AI 模型支持

- ✅ **OpenRouter** - 支持图像输出模型（如 FLUX、Gemini 图像等）
- ✅ **DeepSeek** - DeepSeek Chat, DeepSeek Coder
- ✅ **火山引擎** - Doubao Pro, Doubao Lite
- ✅ **Google Gemini** - Gemini 2.0 Flash, Gemini 1.5 Pro

### 核心功能

- 🎨 自定义画布大小（4x4 到 200x200）
- 🖌️ 多种绘图工具（画笔、橡皮、填充、吸色）
- 🤖 AI 像素画生成
- 📷 本地图片转像素画
- 🎯 1:1 图片裁切
- 📊 拼豆数量统计
- 💾 JSON 格式导出

### 性能优化

- ⚡ React.memo 优化组件渲染
- 🚀 useMemo 和 useCallback 减少重绘
- 🎯 虚拟滚动支持（大网格）
- 📦 本地存储配置

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **AI 接入**: Gemini、OpenRouter、火山引擎等（用户自配 Key）
- **部署平台**: Vercel

## 获取 API Key

### OpenRouter
访问 https://openrouter.ai/keys

### DeepSeek
访问 https://platform.deepseek.com/

### 火山引擎
访问 https://console.volcengine.com/

### Google Gemini
访问 https://makersuite.google.com/app/apikey

## 许可证

MIT License
