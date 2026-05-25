# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

个人主页（portfolio）。TypeScript + React 19 + Vite + Tailwind CSS v4 + Biome + pnpm。
部署在 GitHub Pages，仓库路径为 `/personal_site/`。

## 常用命令

所有命令在 `personal_site/` 目录下执行：

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 启动开发服务器（http://localhost:5173） |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览生产构建 |
| `pnpm lint` | Biome 自动修复 |
| `pnpm format` | Biome 格式化 |
| `pnpm install` | 安装依赖 |

## 架构概览

### 单文件 SPA 结构

全部页面逻辑集中在 [src/App.tsx](src/App.tsx)，包含 5 个 section 组件：
- `HomePage` — 首页（状态点 + 标题 + 描述 + CTA）
- `AboutPage` — 关于页（生活/工作双视图，MBTI 可视化，价值观折叠面板）
- `ProjectsPage` — 项目页（GitHub 贡献图 + 占位卡片）
- `NotesPage` — 笔记页（左侧分类树 + 右侧 Markdown 阅读区）
- `ContactPage` — 联系页（邮箱 + GitHub 链接，打字机效果）

### 路由

使用 hash-based 路由（`#home`、`#about/work`、`#notes` 等），通过 `window.location.hash` 初始化 + `history.replaceState` 导航。无第三方路由库。

### 主题系统

每个 section 绑定一个独立主题，切换页面时全局换色：

| Section | 主题 key | 色名 |
|---------|---------|------|
| home | `earth` | 浅棕米白 |
| about | `earth` | 浅棕米白 |
| projects | `sage` | 浅青绿 |
| notes | `ocean` | 深蓝黑 |
| contact | `black` | 黑 |

主题定义在 [src/App.tsx](src/App.tsx) 的 `themes` 对象中（行 5-58），通过 inline `style` 传递到每个组件。
CSS 自定义属性在 [src/index.css](src/index.css) 中定义了默认配色（方案 C 浅棕米白），但实际由 JS 主题覆盖。

### 笔记系统

- 笔记以 `.md` 文件形式存放在 `src/notes/` 下的分类子目录中
- 每个文件需包含 YAML frontmatter（`title` + `date`）
- [src/notes/index.ts](src/notes/index.ts) 使用 Vite `import.meta.glob` 自动扫描并构建分类树
- Markdown 渲染是轻量的自定义实现（仅支持标题、列表、加粗、段落）

### 共享组件

`SectionTitle`、`Tag`、`NavBar`、`Footer`、`TypingText` 定义在 [src/App.tsx](src/App.tsx) 中，被多个 section 复用。

## 技术栈

- **React 19** — UI 框架
- **TypeScript** (5.7, strict mode) — 类型安全
- **Vite 6** — 构建工具 + 开发服务器
- **Tailwind CSS v4** — 使用 `@tailwindcss/vite` 插件，`@theme` 块定义自定义值
- **Biome 1.9** — Lint + Format
- **pnpm** — 包管理器
- **@fontsource** — Inter + JetBrains Mono Web Font

## Git 提交规范

格式：`<type>(<scope>): <中文描述>`

- type: `feat` / `fix` / `chore` / `style` / `refactor` / `docs`
- scope: 模块范围，如 `router`、`ui`、`config`、`home` 等
- **描述必须用中文**
- 一个提交只做一件事
- 不包含 Claude 签名

详见 [docs/conventional-commits.md](docs/conventional-commits.md)。

## CI/CD

GitHub Actions 工作流 [deploy.yml](.github/workflows/deploy.yml)：
- 触发：推送到 `master` 分支
- 构建时设置 `BASE_URL=/personal_site/`
- 使用 GitHub Pages 部署

## 设计指南

配色、字体、间距、组件风格等设计决策在 [docs/DESIGN.md](docs/DESIGN.md)。
新增或修改 UI 时应参考该文档中的规范。
