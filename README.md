# Night Food

> 一个给家庭使用的点餐、任务、积分与成员协作平台。

Night Food 最初来源于移动端家庭点餐项目，这个仓库是它的 Web 化重构版本。  
它不是面向餐厅商家的外卖系统，而是一个更贴近家庭生活的“小型家庭协作平台”。

家主可以维护菜单、发布任务、审核完成情况、调整积分、管理成员和规则；  
家庭成员可以点餐、领取任务、赚取积分、再把积分用于兑换家庭餐食。

## 为什么做这个项目

很多家庭里都会遇到这些场景：

- 家人想点餐，但菜单、偏好、状态都靠口头沟通
- 家务任务没有统一记录，奖励和反馈机制也不清晰
- 孩子或家人完成任务后，缺少可持续的积分激励
- 家主需要一个简单的后台，而不是复杂的商家系统

Night Food 想解决的不是“餐饮经营”，而是“家庭协作”。

## 核心能力

### 家庭前台 `apps/web`

- 家庭成员注册 / 登录
- 创建家庭或通过邀请码加入家庭
- 浏览菜单并按分类点餐
- 提交订单、查看订单状态、取消订单
- 浏览任务、领取任务、提交任务
- 查看个人资料、家庭归属、当前积分

### 家主管理台 `apps/admin`

- 菜单分类管理
- 菜品管理、价格积分、图片上传、上下架、推荐
- 订单查看与状态流转
- 任务发布、指派、审核、关闭
- 成员管理、角色管理、邀请码刷新
- 积分手动调整
- 家庭规则设置与公告维护

### 平台级能力

- 家庭邀请码入组机制
- 用户注册 / 登录体系
- 基于角色的权限控制
- Supabase 数据库 / 认证 / 存储
- Cloudflare Workers 双端部署
- 支持服务器自托管与反向代理挂载

## 产品闭环

```text
家主维护菜单
   ↓
家庭成员点餐
   ↓
家主处理订单
   ↓
家主发布任务
   ↓
成员完成任务获得积分
   ↓
积分用于兑换家庭餐食
```

## 技术栈

- Frontend: Next.js 15, React 19, TypeScript
- Backend/BFF: Next.js Route Handlers
- Database/Auth/Storage: Supabase
- Deployment: Cloudflare Workers, Docker, Nginx
- Testing: Vitest, Playwright
- Package Manager: pnpm

## 仓库结构

```text
apps/
  web/      家庭成员前台
  admin/    家主管理后台
packages/
  lib/      共享业务工具
  types/    共享类型定义
docs/       架构、部署、路线图与交付文档
supabase/   数据库迁移与初始化资源
workers/    Worker 相关逻辑
legacy/     原项目参考与保留内容
deploy/     服务器部署文件
```

## 本地开发

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

参考 `.env.example` 或已有 `.env.local`，至少需要：

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_SITE_URL=http://localhost:3001
```

### 3. 初始化数据库

按顺序执行 `supabase/migrations` 下的 SQL 文件。

### 4. 启动项目

```bash
pnpm dev:web
pnpm dev:admin
```

默认地址：

- Web: `http://localhost:3000`
- Admin: `http://localhost:3001`

## 常用命令

```bash
pnpm build
pnpm typecheck
pnpm test:unit
pnpm test:e2e
pnpm phase1:readiness
pnpm p0:readiness
```

## 部署方式

### 方案一：Cloudflare + Supabase

这是当前项目最推荐的免费云部署方式。

- Web 部署为 Cloudflare Worker
- Admin 部署为 Cloudflare Worker
- 数据库、认证、对象存储使用 Supabase

相关文档：

- [Cloudflare Deployment](./docs/cloudflare-deployment.md)
- [Cloudflare Workers Builds](./docs/cloudflare-workers-builds.md)
- [GitHub Actions Cloudflare](./docs/github-actions-cloudflare.md)

### 方案二：自托管服务器部署

仓库已经包含基础自托管文件：

- `deploy/server/Dockerfile.next-app`
- `deploy/server/docker-compose.server.yml`
- `deploy/server/nginx-night-food-locations.conf`

支持将 Web 和 Admin 挂载到同一端口的不同后缀路径，例如：

- `/night-food-web`
- `/night-food-admin`

## 当前已完成能力

- 家庭注册 / 登录
- 家庭创建 / 邀请码加入
- 菜单管理
- 菜品图片上传
- 点餐与订单流转
- 家务任务发布 / 领取 / 提交 / 审核
- 积分增减与兑换闭环
- 成员与权限管理
- 家庭规则与公告
- 移动端兼容布局
- Web / Admin 双端独立部署

## 适合谁使用

- 想把家庭点餐做成一个有趣互动流程的家庭
- 想把家务、奖励和积分系统化的家长
- 想学习 Next.js + Supabase + Cloudflare 的开发者
- 想基于这个项目二次开发家庭管理系统的开源社区用户

## 开源协议

本项目采用 [MIT License](./LICENSE) 开源。

这意味着你可以：

- 免费使用
- 修改源码
- 商业使用
- 二次发布

但请保留原始版权和许可证声明。

## 贡献方式

欢迎任何形式的贡献：

- 提交 Issue
- 发起 Pull Request
- 改进文档
- 优化 UI / UX
- 补充测试
- 扩展更多家庭场景玩法

如果你准备进行较大改动，建议先开一个 Issue 讨论方向。

## 路线图

未来可以继续扩展：

- 积分商城
- 家庭排行榜
- 周期性任务模板
- PWA 安装体验
- 通知提醒
- 家庭主题皮肤
- AI 菜单推荐

## 致谢

- 原始 `night-food` 项目提供了核心交互参考
- Supabase 提供数据库、认证与存储能力
- Cloudflare 提供边缘部署能力

---

如果这个项目对你有帮助，欢迎 `Star`、`Fork`，也欢迎把它改造成更适合你家庭场景的版本。
