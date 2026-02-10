# Pixel Bead Studio

一个功能强大的拼豆（Perler Beads/Hama Beads）像素画设计工具，支持 AI 生成、图片转换等功能。

## ✨ 主要特性

### 🎨 核心功能
- **自定义画布大小** - 支持 4x4 到 200x200 的任意尺寸
- **多种绘图工具** - 画笔、橡皮擦、填充工具、吸色器
- **AI 像素画生成** - 支持多个主流 AI 模型
- **本地图片转换** - 上传图片自动转换为像素画
- **1:1 裁切** - 支持左上、居中、右下三种对齐方式
- **拼豆数量统计** - 自动统计每种颜色所需数量
- **导出功能** - 支持 JSON 格式导出图纸

### 🤖 AI 模型支持

#### 当前支持的模型提供商
- ✅ **OpenAI** - GPT-4o, GPT-4o Mini, GPT-4 Turbo
- ✅ **OpenRouter** - 支持多个模型（GPT-4o, Claude 3.5, Gemini 等）
- ✅ **DeepSeek** - DeepSeek Chat, DeepSeek Coder
- ✅ **火山引擎** - Doubao Pro, Doubao Lite
- ✅ **Google Gemini** - Gemini 2.0 Flash, Gemini 1.5 Pro

#### 如何使用 AI 功能
1. 点击右上角 ⚙️ 设置按钮
2. 选择你偏好的 AI 服务商
3. 输入对应的 API Key
4. 选择模型（可选）
5. 在左侧输入描述，点击"一键生成拼豆图"

> 💡 API Key 仅保存在你的浏览器本地存储中，不会上传到服务器

### ⚡ 性能优化
- React.memo 优化组件渲染
- useMemo 和 useCallback 减少重绘
- 大网格支持流畅操作

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd PixelBead

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 🌐 一键部署到 Vercel

### 方式一：通过 Vercel 部署按钮（推荐）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/pixelbead)

### 方式二：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

### 环境变量配置（可选）

在 Vercel 项目设置中，你可以配置以下环境变量：

- `OPENAI_API_KEY` - OpenAI API 密钥
- `OPENROUTER_API_KEY` - OpenRouter API 密钥
- `OPENROUTER_BASE_URL` - OpenRouter 基础 URL（默认: https://openrouter.ai/api/v1）
- `DEEPSEEK_API_KEY` - DeepSeek API 密钥
- `VOLCENGINE_API_KEY` - 火山引擎 API 密钥
- `GEMINI_API_KEY` - Google Gemini API 密钥

> **注意**：当前版本支持用户在应用内配置自己的 API Key，无需配置环境变量。

## 📚 获取 API Key

### OpenAI
访问 https://platform.openai.com/api-keys

### OpenRouter
访问 https://openrouter.ai/keys

### DeepSeek
访问 https://platform.deepseek.com/

### 火山引擎
访问 https://console.volcengine.com/

### Google Gemini
访问 https://makersuite.google.com/app/apikey

## 🛠️ 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **AI SDK**: OpenAI, Google GenAI
- **部署平台**: Vercel

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

Made with ❤️ for pixel art lovers
