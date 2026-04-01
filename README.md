# 拼豆糕手

一个功能强大的拼豆（Perler Beads/Hama Beads）像素画设计工具，支持智能生成拼豆示意图、本地图片转图纸等功能。

![首页](./屏幕截图%202026-03-04%20112130.png)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DanZai233/PixelBead)

[![](https://img.shields.io/github/license/DanZai233/PixelBead)](https://github.com/DanZai233/PixelBead/blob/main/LICENSE)
[![](https://img.shields.io/github/stars/DanZai233/PixelBead)](https://github.com/DanZai233/PixelBead/stargazers)
[![](https://img.shields.io/github/forks/DanZai233/PixelBead)](https://github.com/DanZai233/PixelBead/network/members)

## ✨ 主要特性

### 🎨 核心功能
- **自定义画布大小** - 支持 4x4 到 200x200 的任意尺寸
- **多种绘图工具** - 画笔、橡皮擦、填充工具、吸色器、直线、矩形、圆形
- **多种像素样式** - 圆形、方形、圆角三种样式切换
- **专业调色板** - 支持 HSL 颜色选择器、HEX 直接输入
- **智能生成拼豆图** - 由服务端提供的免费生成能力（需在 Vercel 配置服务端密钥）
- **本地图片转换** - 上传图片自动转换为像素画
- **高级裁切功能** - 支持自由选择图片任意区域转换为像素画
- **1:1 裁切** - 支持左上、居中、右下三种对齐方式
- **拼豆数量统计** - 自动统计每种颜色所需数量
- **导出图片** - 支持导出为 PNG 图片，可选择是否显示辅助线
- **导出项目** - 支持 JSON 格式导出图纸，便于后续编辑

### 📱 移动端优化
- **虚拟摇杆控制** - 左摇杆控制画布移动（360度自由移动），右摇杆控制缩放（上推放大，下推缩小）
- **触摸优化** - 双指缩放、单指拖动画布
- **响应式布局** - 完美适配手机、平板等各种屏幕尺寸
- **移动端专用工具栏** - 针对触摸操作优化的工具面板

### 🎯 选区操作
- **框选功能** - 使用矩形工具框选任意区域
- **复制/粘贴** - 复制选区内容到剪贴板，支持粘贴到任意位置
- **剪切** - 剪切选区内容到剪贴板，原位置清空
- **清除** - 快速清除选区内容
- **反选** - 将白色区域替换为当前色，其他区域替换为白色
- **排除颜色** - 将选区内的当前色替换为白色

### 🎭 沉浸拼豆模式
- **全屏查看** - 沉浸式查看拼豆作品
- **网格/标尺切换** - 随时切换显示网格线和标尺
- **辅助线显示** - 每5格显示一条辅助线，方便数格子
- **色号显示** - 显示每个像素对应的色号
- **颜色高亮** - 点击颜色统计，高亮显示该颜色的所有位置
- **锁定/解锁** - 防止误操作，锁定后无法编辑

### 🎭 多色板与颜色合并
- **多色板预设** - 支持全色板、168色、144色、96色、48色快速切换
- **相似颜色合并** - 基于 HSL 色彩空间的智能颜色合并算法
- **可调合并阈值** - 0-50% 阈值调节，灵活控制颜色数量
- **多品牌色号系统** - 支持 MARD、COCO、漫漫、盼盼、咪小窝五大品牌
- **色号自动映射** - 根据选择的品牌自动显示对应色号
- **实时统计更新** - 合并后自动更新颜色统计和所需数量

### 🔗 分享与素材
- **云端存储** - 使用 Upstash Redis 存储拼豆图纸
- **一键分享** - 点击分享按钮生成链接，复制即可分享
- **自动加载** - 打开分享链接自动加载图纸
- **7天有效期** - 分享链接7天后自动失效
- **素材广场** - 浏览和分享他人的拼豆作品
- **点赞功能** - 为喜欢的作品点赞
- **作品收藏** - 收藏喜欢的拼豆设计
- **无缝体验** - 支持撤销、编辑后再次分享

### 📦 多平台支持
- **Web 应用** - 支持所有现代浏览器，无需安装
- **iOS App** - 基于 Capacitor 封装，原生壳 + WKWebView，可上架 App Store
- **微信小程序** - 使用 WebView 内嵌 H5，开发量最少，体验流畅
- **一键部署** - 支持 Vercel 一键部署

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

### 🤖 智能生成拼豆图

- 用户在应用内输入描述或上传参考图，请求发往 **Vercel 无服务器接口** `/api/ai/generate-image`，由服务端调用已配置的图像生成能力并返回结果。
- **客户端不包含任何第三方 AI 密钥或服务商配置**，符合 App Store 对「非 IAP 解锁」的要求。
- 部署时在 Vercel 环境变量中配置 `PIXELBEAD_AI_API_KEY`（必填），以及可选的 `PIXELBEAD_AI_API_BASE`、`PIXELBEAD_AI_IMAGE_MODEL`（见 `.env.example`）。

### ⚡ 性能优化
- **Canvas 渲染引擎** - 支持大网格（200x200）流畅操作
- **React.memo 优化** - 减少不必要的组件渲染
- **useMemo 和 useCallback** - 优化事件处理和计算
- **requestAnimationFrame** - 虚拟摇杆使用 RAF 实现流畅动画
- **高效统计算法** - 快速计算颜色数量和分布
- **移动端触摸优化** - 优化触摸事件处理，减少延迟

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

## 📱 iOS App 构建

项目使用 [Capacitor](https://capacitorjs.com/) 将 Web 应用打包为原生 iOS App（WKWebView），无需重构代码。

### 前置要求
- macOS + Xcode（最新稳定版）
- Apple Developer 账号（上架 App Store 需要）
- Node.js 18+

### 构建步骤

```bash
# 1. 安装依赖（首次）
npm install

# 2. 配置 iOS 构建环境变量
#    编辑 .env.capacitor，设置 VITE_API_BASE_URL 为你的线上域名（无尾斜杠）
#    例如：VITE_API_BASE_URL=https://pindou.danzaii.cn
#    cap:sync 会使用 vite build --mode capacitor 自动加载该文件

# 3. 构建 Web 产物并同步到 iOS 项目（含正确注入的 API 基地址）
npm run cap:sync

# 4. 在 Xcode 中打开项目
npm run cap:open
```

### 日常开发流程

每次修改 Web 代码后，运行以下命令将最新构建同步到 iOS 项目：

```bash
npm run cap:sync    # 等价于 vite build --mode capacitor + cap sync ios
```

然后在 Xcode 中重新 Run (Cmd+R) 即可看到更新。

### 关键配置

| 配置项 | 值 |
|--------|-----|
| Bundle ID | `com.pixelbead.studio` |
| App Name | 拼豆糕手 |
| Web Dir | `dist` |
| 配置文件 | `capacitor.config.ts` |

### 注意事项
- App 内请求线上 `/api`（素材广场、**智能生成**等）依赖 `VITE_API_BASE_URL`，须写在 `.env.capacitor` 并用 `npm run cap:sync` 构建；勿只用默认 `npm run build` 再同步，否则变量不会打进包
- App 图标和启动画面源文件在 `assets/` 目录，修改后运行 `npx capacitor-assets generate --ios` 重新生成
- `ios/App/App/public/` 目录由 `cap sync` 自动生成，不要手动修改

## 📱 微信小程序部署

### 快速开始
1. 注册微信小程序账号：https://mp.weixin.qq.com/
2. 配置业务域名（必须是 HTTPS 且已备案）
3. 下载微信开发者工具
4. 导入 `miniprogram` 目录
5. 填入 AppID
6. 修改配置文件中的 H5 域名
7. 点击"编译"预览，确认无误后上传提交审核

详细说明请查看：[微信小程序文档](./miniprogram/README.md)

## 🌐 一键部署到 Vercel

### 方式一：通过 Vercel 部署按钮（推荐）

### 环境变量配置（Vercel）

智能生成（服务端）：

- `PIXELBEAD_AI_API_KEY`（必填）
- `PIXELBEAD_AI_API_BASE`（可选，服务端内置默认值）
- `PIXELBEAD_AI_IMAGE_MODEL`（可选，服务端内置默认值）

其他：Upstash、MongoDB 等同原说明。详见 `.env.example`。

本地开发若需调用线上接口，可设置 `VITE_AI_GENERATE_URL=https://你的已部署域名`（勿提交密钥）。

## 🛠️ 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **智能生成**: 服务端代理，密钥仅 Vercel 环境变量
- **部署平台**: Vercel
- **存储服务**: Upstash Redis（分享链接）、MongoDB Atlas（素材广场）
- **样式**: Tailwind CSS（CDN 加载）
- **3D 渲染**: Three.js（3D 视图）
- **iOS 封装**: Capacitor（WKWebView 原生壳）
- **小程序**: 微信小程序 WebView（内嵌 H5）

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

### 贡献指南
- Fork 本项目
- 创建特性分支 (`git checkout -b feature/AmazingFeature`)
- 提交更改 (`git commit -m 'feat: 添加某个功能'`)
- 推送到分支 (`git push origin feature/AmazingFeature`)
- 创建 Pull Request

### 路线图
- [ ] 添加更多品牌色号支持
- [ ] 支持导出 PDF 格式
- [ ] 添加图层管理功能
- [ ] 支持导出为 SVG 矢量图
- [ ] 添加 undo/redo 步数限制设置
- [ ] 支持导入/导出调色板
- [ ] 添加模板库
- [ ] 支持多人协作编辑
- [x] iOS App（Capacitor）
- [ ] Android App（Capacitor）
- [ ] iOS 原生 Haptic 反馈
- [ ] iOS 本地相册保存

---

## 📸 功能截图

### 主界面
![主界面](屏幕截图%202026-03-04%20112130.png)

### 移动端虚拟摇杆
移动端专属的虚拟摇杆控制器，提供流畅的画布移动和缩放体验。

### 素材广场
浏览和分享其他用户创作的拼豆作品。

### 沉浸拼豆模式
专注于创作的全屏查看模式，支持多种显示选项。

---

Made with ❤️ for pixel art lovers

## 📧 联系方式

- 项目地址: https://github.com/DanZai233/PixelBead
- 问题反馈: [提交 Issue](https://github.com/DanZai233/PixelBead/issues)
