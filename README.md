# 拼豆糕手

一个功能强大的拼豆（Perler Beads/Hama Beads）像素画设计工具，支持 AI 生成、图片转换等功能。

![首页](屏幕截图%202026-03-04%20112130.png)

## ✨ 主要特性

### 🎨 核心功能
- **自定义画布大小** - 支持 4x4 到 200x200 的任意尺寸
- **多种绘图工具** - 画笔、橡皮擦、填充工具、吸色器、直线、矩形、圆形
- **多种像素样式** - 圆形、方形、圆角三种样式切换
- **专业调色板** - 支持 HSL 颜色选择器、HEX 直接输入
- **AI 像素画生成** - 支持多个主流 AI 模型
- **本地图片转换** - 上传图片自动转换为像素画
- **1:1 裁切** - 支持左上、居中、右下三种对齐方式
- **拼豆数量统计** - 自动统计每种颜色所需数量
- **导出功能** - 支持 JSON 格式导出图纸

### 🎭 多色板与颜色合并
- **多色板预设** - 支持全色板、168色、144色、96色、48色快速切换
- **相似颜色合并** - 基于 HSL 色彩空间的智能颜色合并算法
- **可调合并阈值** - 0-50% 阈值调节，灵活控制颜色数量
- **多品牌色号系统** - 支持 MARD、COCO、漫漫、盼盼、咪小窝五大品牌
- **色号自动映射** - 根据选择的品牌自动显示对应色号
- **实时统计更新** - 合并后自动更新颜色统计和所需数量

### 🔗 分享功能
- **云端存储** - 使用 Upstash Redis 存储拼豆图纸
- **一键分享** - 点击分享按钮生成链接，复制即可分享
- **自动加载** - 打开分享链接自动加载图纸
- **7天有效期** - 分享链接7天后自动失效
- **无缝体验** - 支持撤销、编辑后再次分享

### ⌨️ 快捷键与操作
- **键盘快捷键**
  - `B` - 画笔工具
  - `E` - 橡皮工具
  - `G` - 填充工具
  - `I` - 吸色工具
  - `L` - 直线工具
  - `R` - 矩形工具
  - `C` - 圆形工具
- **鼠标操作**
  - `Ctrl + 滚轮` - 缩放画布
  - `中键拖动` - 移动画布
  - `Space + 拖动` - 移动画布
- **快捷键面板**
  - 点击工具栏上方的"查看快捷键"按钮，查看完整的快捷键和工具说明

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
- Canvas 渲染引擎 - 支持大网格（200x200）流畅操作
- React.memo 优化组件渲染
- useMemo 和 useCallback 减少重绘
- 优化事件处理和指针管理
- 高效的颜色选择和统计算法

## 🚀 快速开始

### 本地开发

```bash
# 克隆项目
git clone https://github.com/DanZai233/PixelBead.git
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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DanZai233/PixelBead)

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

## 🙏 致谢

本项目的多色板支持和颜色合并功能深受以下开源项目的启发和参考：

- **[Zippland/perler-beads](https://github.com/Zippland/perler-beads)** - 感谢作者在颜色合并算法、色号映射系统等方面的优秀实现，为本项目提供了宝贵的灵感和参考

感谢所有开源贡献者的无私分享！🌟

## 📄 许可证

本项目采用 **CC BY-NC 4.0**（署名-非商业性 4.0）许可证

您被允许：
- ✅ **分享** - 在任何媒介或格式中复制和分发材料
- ✅ **改编** - 混合、转换和基于材料构建

但在以下条件下：
- 📝 **署名** - 必须给出适当的署名，提供许可证链接，并指出是否进行了更改
- 🚫 **非商业性** - 不得将材料用于商业目的

**禁止的商业行为包括但不限于：**
- 出售或以任何形式货币化此项目或其衍生作品
- 在任何销售或商业使用的产品或服务中使用此项目
- 以直接或间接产生收入的方式分发此项目
- 用于广告或促销目的
- 在商业环境中或作为商业运营的一部分使用

> ⚠️ **重要声明**：本项目仅限个人学习、研究和非商业性使用。任何形式的商业使用（包括但不限于出售、出租、授权或以营利为目的的任何使用）均被严格禁止。

**如需商业授权，请联系版权所有者。**

详细信息请访问：https://creativecommons.org/licenses/by-nc/4.0/

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

Made with ❤️ for pixel art lovers
