# PixelBead Mobile App

## What This Is

将 PixelBead Web 应用转换为原生移动应用（Android 和 iOS），使用 React Native 技术栈实现跨平台开发。保留 Web 版本的所有核心功能，优化移动端用户体验，支持完全离线操作，并通过应用商店分发触达更多用户。

## Core Value

移动用户可以随时随地设计拼豆作品，离线使用核心编辑功能，通过应用商店触达更广泛的用户群。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 使用 React Native 实现跨平台移动应用（Android + iOS）
- [ ] 迁移所有 Web 版核心功能到移动端
- [ ] 支持完全离线操作（核心编辑功能）
- [ ] 素材广场仅在线可用
- [ ] 优化移动端 UI 和触摸交互
- [ ] 与 Web 端共享业务逻辑（颜色系统、工具函数）
- [ ] 通过应用商店分发
- [ ] 不影响现有 Web 代码（独立子目录开发）

### Out of Scope

- [Web 版功能变更] — 保持 Web 版本不变，仅开发移动端
- [跨平台同步] — 移动端和 Web 端作品数据暂时不互通
- [Push 通知] — 暂不支持，后续可考虑

## Context

### 现有项目架构

PixelBead Web 版是一个成熟的 React 19 + TypeScript + Vite 6 前端应用，包含以下核心模块：

**核心编辑功能**：
- 自定义画布大小（4x4 到 200x200）
- 多种绘图工具（画笔、橡皮擦、填充、吸色器、直线、矩形、圆形）
- 三种像素样式（圆形、方形、圆角）
- HSL 颜色选择器和 HEX 输入
- AI 像素画生成（支持多个 AI 模型）
- 本地图片转换和高级裁切
- 选区操作（复制、粘贴、剪切、清除、反选）

**颜色系统**：
- 多色板预设（全色板、168色、144色、96色、48色）
- 相似颜色合并算法（基于 HSL 色彩空间）
- 多品牌色号系统（MARD、COCO、漫漫、盼盼、咪小窝）
- 色号自动映射和实时统计

**分享与素材**：
- Upstash Redis 云端存储（7天有效期）
- 一键分享功能
- MongoDB Atlas 素材广场（点赞、收藏）

**数据存储**：
- Redis (Upstash): 分享链接
- MongoDB Atlas: 素材广场
- 前端直接调用 API

### 技术约束

1. **代码隔离**：移动端代码放在独立子目录（如 `/mobile`），不影响现有 Web 代码
2. **部署保护**：main 分支自动触发 Vercel 部署，开发过程不能影响
3. **代码共享**：业务逻辑（颜色系统、工具函数）需要 Web 端和移动端共享
4. **离线需求**：核心编辑功能必须支持完全离线
5. **素材广场限制**：素材广场仅在线可用（需要 MongoDB 连接）

### 移动端特殊需求

1. **触摸优化**：已实现虚拟摇杆控制（左摇杆移动画布，右摇杆缩放）
2. **响应式布局**：完美适配手机、平板
3. **移动端专用工具栏**：触摸操作优化
4. **性能要求**：支持大网格（200x200）流畅操作
5. **本地存储**：离线时用户作品需要本地保存

## Constraints

- **技术栈**: React Native + TypeScript — 继承现有 React 技术栈，减少学习成本
- **代码隔离**: 移动端代码在独立子目录 `/mobile`，不影响 Web 代码 — 防止误触发现有的 Vercel 部署
- **代码共享**: Web 端和移动端共享业务逻辑（颜色系统、工具函数） — 减少重复开发，保持一致性
- **部署**: Web 版和移动端分开部署 — Web 版通过 Vercel，移动端通过应用商店
- **离线支持**: 核心编辑功能必须完全离线可用 — 素材广场除外，仅在线可用
- **数据库**: 移动端需要本地存储方案（AsyncStorage 或 SQLite） — Web 版使用 Redis/MongoDB，移动端不同
- **性能**: 必须支持大网格（200x200）流畅操作 — 与 Web 版性能要求一致
- **UI 适配**: 需要为移动端重新设计 UI — 优化触摸交互，适配不同屏幕尺寸

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React Native 技术栈 | 继承现有 React 技术栈，社区成熟，跨平台支持好 | — Pending |
| 独立子目录开发 | 不影响 Web 代码，防止误触 Vercel 部署 | — Pending |
| 共享业务逻辑 | 减少重复开发，保持 Web 端和移动端一致性 | — Pending |
| 核心功能离线 | 移动用户随时随地可使用，提升用户体验 | — Pending |
| 素材广场仅在线 | 需要 MongoDB 连接，移动端不适合集成 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
---
*Last updated: 2026-03-28 after initialization*
