# 项目待办清单 (Personal Site)

> **最后更新:** 2026-05-21
> **目标:** 构建一个**现代化、专业化**的个人网站，采用工业级前端工程标准。

---

## 架构决策 (Architecture Decision Record)

### 1. 核心栈
- **语言:** TypeScript (强类型，必选)
- **框架:** React 19 (配合 Vite)
- **构建工具:** Vite (极速 HMR 与构建)
- **包管理:** pnpm (严格依赖树，提升磁盘效率)

### 2. 路由方案
- **选择:** TanStack Router
- **理由:** 编译时类型安全路由，URL 参数与组件 Props 自动同步。比 React Router 更现代、更安全。

### 3. UI 与样式
- **样式引擎:** Tailwind CSS (原子化 CSS，高效开发)
- **工具库:** clsx + tailwind-merge (处理动态类名冲突)
- **组件库:** shadcn/ui (复制源码到项目，高度可控，拒绝黑盒)

### 4. 工程与规范
- **Lint/Format:** Biome (Rust 编写，替代 ESLint + Prettier，快 100 倍)
- **Git 规范:** Conventional Commits + Husky + Commitlint (结构化提交信息)
- **AI 行为:** CLAUDE.md (约束 AI 输出风格，保持代码一致性)

### 5. 部署与域名
- **域名:** `.me` (个人展示首选)
- **部署:** Cloudflare Pages / Vercel (全球 CDN + 自动 HTTPS + 预览环境)
- **备注:** 朋友 NAS 仅作为备选或数据库/服务托管，前端静态文件走 CDN 体验更佳。

---

## 待执行任务

- [ ] 配置 pnpm 镜像源（可选，视网络情况）
- [ ] 初始化 Vite + React + TypeScript + pnpm
- [ ] 配置 Biome (Lint + Format)
- [ ] 安装 Tailwind CSS + clsx + tailwind-merge
- [ ] 引入 shadcn/ui 基础组件 (Button, Card, Navigation)
- [ ] 配置 TanStack Router (文件路由或手动路由)
- [ ] 配置 Husky + Commitlint (提交拦截)
- [ ] 编写 CLAUDE.md (定义 AI 编码规范)
- [ ] 搭建基础页面 (Home, About, Projects)
- [ ] 接入 CI/CD 部署到 Cloudflare Pages

## 已完成

- [x] 确定技术栈选型 (2026-05-21)
- [x] 更新 Git 用户信息 (Chen Yanmo)
- [x] 初始化 Git 仓库
