# 网站统计功能

## 概述

本网站使用 Upstash + Vercel Edge Functions 实现了一个自定义的访问统计系统。

## 功能

### 1. 数据记录
- **总访问量**：记录所有页面访问次数
- **每日访问量**：记录每天的访问次数
- **设备类型**：区分移动端和桌面端访问
- **访问路径**：记录用户访问的页面路径

### 2. 数据展示
点击左下角的统计信息栏可以打开统计页面，显示：
- 总访问量
- 今日访问量
- 近7天访问量
- 近7天趋势图表
- 设备分布（移动端/桌面端）
- 每日详细数据

## 技术实现

### API 端点
- **路径**：`/api/analytics`
- **方法**：GET, POST

### POST - 记录访问
```json
{
  "path": "/",
  "userAgent": "Mozilla/5.0..."
}
```

### GET - 获取统计数据
```json
{
  "total": 1234,
  "daily": {
    "2026-03-10": {
      "visits": 100,
      "path:/": 80,
      "device:mobile": 60,
      "device:desktop": 40
    }
  }
}
```

### 数据存储
使用 Upstash Redis 存储：
- `analytics:total` - 总访问量
- `analytics:daily:{date}` - 每日数据（30天过期）

## 部署说明

1. 确保 Upstash 环境变量已配置：
   - `VITE_UPSTASH_REDIS_REST_URL`
   - `VITE_UPSTASH_REDIS_REST_TOKEN`

2. 部署到 Vercel 后，API 会自动部署为 Edge Function

3. 访问网站时会自动记录统计信息

## 特点

- ✅ 隐私友好：不收集个人数据，只记录匿名统计
- ✅ 性能优化：使用 Edge Function，响应快速
- ✅ 数据持久：存储在 Upstash，可靠性高
- ✅ 自动过期：每日数据30天后自动清理
- ✅ 响应式：支持移动端和桌面端展示

## 未来改进

- 添加更多维度统计（如访问时长、跳出率等）
- 添加数据导出功能
- 添加访问热力图
- 添加时间段统计（小时、星期等）
