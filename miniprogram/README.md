# 微信小程序 - WebView 版

这是"拼豆糕手"的微信小程序版本，使用 WebView 内嵌 H5 页面实现，开发量最少。

## 项目结构

```
miniprogram/
├── app.json              # 小程序配置
├── app.js                # 小程序逻辑
├── app.wxss              # 全局样式
├── project.config.json    # 项目配置
├── sitemap.json          # 站点地图
└── pages/
    └── index/
        ├── index.wxml    # 页面结构
        ├── index.js      # 页面逻辑
        ├── index.json    # 页面配置
        └── index.wxss    # 页面样式
```

## 功能特性

### ✅ 已实现
- WebView 内嵌 H5 页面
- H5 ↔ 小程序双向通信
- 保存图片到相册
- 分享功能
- 获取用户信息
- 预览图片
- 版本更新检查

### 🔜 待扩展
- 支付功能（需要使用小程序原生支付）
- 更多的原生功能（如扫码、定位等）

## 开发步骤

### 1. 配置小程序

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 注册小程序账号（个人或企业）
3. 获取 AppID

### 2. 配置业务域名

1. 进入小程序后台 → 开发 → 开发设置 → 业务域名
2. 添加你的 H5 域名（必须备案）
3. 下载校验文件并放到网站根目录

### 3. 修改配置文件

编辑 `miniprogram/project.config.json`：
```json
{
  "appid": "your-appid",  // 替换为你的 AppID
  "projectname": "pixel-bead-miniprogram"
}
```

编辑 `miniprogram/pages/index/index.js`：
```javascript
data: {
  webSrc: 'https://pindou.danzaii.cn'  // 你的 H5 域名
}
```

### 4. 使用微信开发者工具

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开开发者工具
3. 导入项目，选择 `miniprogram` 目录
4. 输入 AppID
5. 点击"编译"预览

## H5 端改动

### 添加微信桥接工具

已创建 `utils/wechatBridge.ts`，在组件中使用：

```typescript
import wechatBridge from './utils/wechatBridge'

// 保存图片
const handleExport = async () => {
  const canvas = await generateExportImage({...})
  const imageUrl = canvas.toDataURL('image/png')

  // 自动检测环境并使用正确的保存方式
  if (wechatBridge.isInMiniProgramEnv()) {
    await wechatBridge.saveToAlbum(imageUrl)
  } else {
    // Web 端保存方式
    const a = document.createElement('a')
    a.href = imageUrl
    a.download = 'pixel-bead.png'
    a.click()
  }
}
```

### 支持的其他功能

```typescript
// 分享
wechatBridge.share('拼豆糕手', '像素画创作工具')

// 获取用户信息
wechatBridge.getUserInfo()

// 预览图片
wechatBridge.previewImage(['url1', 'url2'], 0)

// 检测是否在小程序中
if (wechatBridge.isInMiniProgramEnv()) {
  // 小程序特有逻辑
}
```

## 调试技巧

### 1. 查看控制台
- H5 端：在 Chrome DevTools 中查看
- 小程序端：在微信开发者工具的 Console 中查看

### 2. 消息通信调试
```javascript
// H5 端
console.log('[H5] 发送消息：', message)

// 小程序端
console.log('[小程序] 收到消息：', message)
```

### 3. 真机调试
1. 点击开发者工具的"预览"
2. 用微信扫码
3. 在手机上测试

## 发布流程

### 1. 上传代码
在微信开发者工具中：
- 点击"上传"按钮
- 填写版本号和项目备注

### 2. 提交审核
1. 登录微信公众平台
2. 版本管理 → 开发版本
3. 选中原版本，点击"提交审核"
4. 填写审核信息

### 3. 发布
审核通过后：
1. 版本管理 → 审核版本
2. 点击"发布"

## 注意事项

### ⚠️ WebView 限制

1. **必须配置业务域名**
   - 域名必须备案
   - 必须是 HTTPS
   - 不支持 IP 地址

2. **功能限制**
   - ❌ 不支持小程序原生支付
   - ❌ 不支持部分 JS API（如定位、蓝牙等）
   - ✅ 支持大部分交互功能
   - ✅ 支持文件上传（有限制）

3. **性能问题**
   - WebView 性能低于原生
   - 首次加载需要时间
   - 建议优化 H5 加载速度

### 🔐 权限配置

在 `app.json` 中配置：
```json
{
  "permission": {
    "scope.writePhotosAlbum": {
      "desc": "保存拼豆作品到相册"
    }
  }
}
```

## 常见问题

### Q1: 页面显示空白？
**A:** 检查业务域名是否正确配置，域名是否可访问。

### Q2: 保存图片失败？
**A:** 检查是否授权了相册权限，在设置中查看。

### Q3: 消息通信不工作？
**A:** 确保 H5 在 WebView 中加载，检查控制台错误信息。

### Q4: 如何更新 H5 内容？
**A:** 直接部署 H5 网站，小程序会自动加载最新内容。

## 扩展建议

### 短期优化
1. 添加加载动画
2. 优化首屏加载速度
3. 添加更多错误处理

### 长期规划
如果需要更好的性能和体验，可以考虑：
1. 使用 Taro 重写核心功能
2. 混合开发模式（部分功能原生，部分 WebView）

## 联系方式

如有问题，请提交 Issue 或联系开发者。
