# 微信小程序快速开始指南

## 📋 前置要求

1. 注册微信小程序账号：https://mp.weixin.qq.com/
2. 下载微信开发者工具：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
3. 你的 H5 网站已部署且域名已备案

## 🚀 5 分钟快速部署

### Step 1: 获取 AppID
1. 登录微信公众平台
2. 开发 → 开发管理 → 开发设置
3. 复制 AppID

### Step 2: 配置业务域名
1. 小程序后台 → 开发 → 开发设置 → 业务域名
2. 添加你的域名：`https://pindou.danzaii.cn`
3. 下载校验文件，上传到你的网站根目录
4. 验证域名

### Step 3: 修改配置文件
编辑 `miniprogram/project.config.json`：
```json
{
  "appid": "你的AppID"
}
```

### Step 4: 打开小程序
1. 打开微信开发者工具
2. 导入项目
3. 选择 `miniprogram` 目录
4. 填入 AppID
5. 点击"编译"

### Step 5: 预览测试
1. 点击"预览"按钮
2. 用微信扫码
3. 在手机上测试功能

## ✅ 核心功能

### 保存图片到相册
在 H5 端导出图片时，会自动检测环境：
- 小程序环境：调用原生保存相册
- Web 环境：下载文件

### 分享功能
点击右上角"..." → 转发给朋友

### 用户授权
首次保存图片时，会请求相册权限

## 🔧 配置说明

### 修改 H5 域名
编辑 `miniprogram/pages/index/index.js`：
```javascript
data: {
  webSrc: 'https://your-domain.com'  // 改成你的域名
}
```

### 自定义分享内容
编辑 `miniprogram/pages/index/index.js`：
```javascript
onShareAppMessage() {
  return {
    title: '拼豆糕手',
    path: '/pages/index/index',
    imageUrl: '/assets/share-cover.jpg'
  }
}
```

## 📱 调试技巧

### 1. 真机调试
- 微信开发者工具 → 预览 → 扫码
- 在手机上打开"调试"按钮

### 2. 查看 H5 控制台
- 真机调试时，手机会弹出一个 vConsole
- 可以查看 H5 的日志

### 3. 查看小程序控制台
- 微信开发者工具的 Console 面板

## 🐛 常见问题

### Q: 页面空白？
**A:** 检查业务域名是否配置正确，域名是否可访问。

### Q: 保存失败？
**A:** 检查是否授权相册权限，在设置中查看。

### Q: 消息通信失败？
**A:** 检查 H5 页面是否正确加载，查看控制台错误。

## 📚 详细文档

查看 `miniprogram/README.md` 获取完整文档。

## 🎯 下一步

1. 在小程序后台提交审核
2. 审核通过后发布
3. 监控用户反馈

## 💡 优化建议

1. 添加启动页动画
2. 优化 H5 加载速度
3. 添加错误提示
4. 添加用户反馈入口
