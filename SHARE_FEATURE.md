# 拼豆分享功能使用说明

## 功能概述

新增的分享功能允许用户将拼豆图纸保存到 Upstash 云存储，并生成分享链接。其他用户可以通过链接直接查看和加载图纸。

## 功能特性

- ✅ 云端存储：使用 Upstash Redis 存储，数据持久化
- ✅ 快速分享：一键生成分享链接
- ✅ 自动过期：分享链接7天后自动失效
- ✅ 无缝加载：点击链接自动加载图纸
- ✅ 一键复制：提供复制链接按钮

## 配置步骤

### 1. 创建 Upstash 数据库

1. 访问 [Upstash Console](https://console.upstash.com/)
2. 登录或注册账号
3. 点击 "Create Database"
4. 选择区域（推荐选择离你用户最近的区域）
5. 创建数据库

### 2. 获取连接信息

1. 在数据库详情页面，找到 "REST API" 部分
2. 复制 "UPSTASH_REDIS_REST_URL"
3. 复制 "UPSTASH_REDIS_REST_TOKEN"

### 3. 配置环境变量

#### Vercel 部署

1. 进入 Vercel 项目设置
2. 添加环境变量：
   ```
   名称: VITE_UPSTASH_REDIS_REST_URL
   值: [复制的 URL]

   名称: VITE_UPSTASH_REDIS_REST_TOKEN
   值: [复制的 Token]
   ```
3. 重新部署项目

#### 本地开发

在项目根目录创建 `.env` 文件：
```
VITE_UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
VITE_UPSTASH_REDIS_REST_TOKEN=AXXX...
```

## 使用方法

### 分享拼豆图纸

1. **完成拼豆设计**
2. 点击顶部工具栏的 **"分享"** 按钮（绿色按钮）
3. 等待生成分享链接
4. 在弹出窗口中：
   - 点击 **"复制"** 按钮复制链接
   - 或手动复制链接
5. 将链接分享给朋友或发布到社交媒体

### 加载分享的图纸

1. **打开分享链接**
2. 系统自动检测并加载图纸
3. 提示"已加载分享的拼豆图纸！"
4. 开始编辑或导出

## 技术实现

### 数据结构

```typescript
interface ShareData {
  grid: string[][];        // 拼豆网格数据
  gridSize: number;        // 网格尺寸
  pixelStyle: 'CIRCLE' | 'SQUARE' | 'ROUNDED';  // 像素样式
  createdAt: number;        // 创建时间戳
  expiresAt: number;        // 过期时间戳
}
```

### 存储机制

1. **生成唯一 Key**：使用时间戳 + 随机字符串
2. **数据序列化**：将图纸数据转换为 JSON
3. **存储到 Redis**：使用 Upstash REST API
4. **设置过期**：7天后自动删除（604800秒）

### URL 格式

```
https://pindou.danzaii.cn/#share={encoded_key}
```

### 安全考虑

- ✅ 数据仅存储7天
- ✅ 使用唯一 Key 防止冲突
- ✅ 过期数据自动清理
- ✅ 客户端直接存储（无需服务器代理）

## 故障排除

### 分享按钮无响应

1. **检查环境变量**
   - 确认 VITE_UPSTASH_REDIS_REST_URL 已配置
   - 确认 VITE_UPSTASH_REDIS_REST_TOKEN 已配置

2. **检查网络连接**
   - 确认可以访问 Upstash 服务器
   - 检查浏览器控制台是否有错误

3. **检查 Upstash 配额**
   - 免费版可能有限制
   - 查看使用量是否超限

### 链接过期

- 分享链接7天后自动失效
- 过期后会提示"未找到分享数据"

### 无法加载分享

1. **确认链接完整**
   - 检查是否复制了完整链接
   - 确保 `#share=` 参数存在

2. **清除浏览器缓存**
   - 有时缓存可能导致问题
   - 尝试无痕模式打开

## 注意事项

1. **数据安全**
   - 不要分享敏感信息
   - 7天后数据自动删除

2. **存储限制**
   - 免费版有每日请求限制
   - 建议升级付费版以保证稳定性

3. **跨域问题**
   - Upstash REST API 支持 CORS
   - 浏览器可直接访问

## 未来扩展

- [ ] 添加密码保护选项
- [ ] 支持设置自定义过期时间
- [ ] 添加分享统计（访问次数）
- [ ] 支持二维码生成
- [ ] 添加社交媒体一键分享
