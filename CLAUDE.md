# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

个人主页（portfolio）。TypeScript + React 19 + Vite + Tailwind CSS v4 + Biome + pnpm。
部署在 GitHub Pages，仓库路径为 `/personal_site/`。

## 常用命令

所有命令在 `personal_site/` 目录下执行：

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 类型检查 + 生产构建 |
| `pnpm preview` | 预览生产构建 |
| `pnpm lint` | Biome 自动修复 |
| `pnpm format` | Biome 格式化 |
| `pnpm install` | 安装依赖 |

**本项目无测试框架**，无需运行测试。

## 架构概览

### 单文件 SPA 结构

全部页面逻辑集中在 [src/App.tsx](src/App.tsx)，包含 5 个 section 组件：
- `HomePage` — 首页
- `AboutPage` — 关于页（生活/工作双视图，MBTI 可视化，价值观/人际关系折叠面板）
- `ProjectsPage` — 项目页（GitHub 贡献图 + 占位卡片）
- `NotesPage` — 笔记页（左侧分类树 + 右侧 Markdown 阅读区 + 滚动进度指示器）
- `ContactPage` — 联系页（打字机效果）

### 路由

Hash-based 路由（`#home`、`#about/personal`、`#about/work` 等），通过 `window.location.hash` 初始化 + `history.replaceState` 导航。

新增页面需在 `sectionMap`、`sectionTheme` 中注册，并在 `NavBar` 的 `links` 中添加。

### 主题系统

每个 section 绑定一个独立主题，切换页面时全局换色：

| Section | 主题 key | 色名 |
|---------|---------|------|
| home | `earth` | 浅棕米白 |
| about | `earth` | 浅棕米白 |
| projects | `sage` | 浅青绿 |
| notes | `ocean` | 深蓝黑 |
| contact | `black` | 黑 |

主题定义在 [src/App.tsx](src/App.tsx) 的 `themes` 对象中，通过 inline `style` 传递。

### 笔记系统

笔记以 `.md` 文件存放在 `src/notes/` 下的分类子目录中，需包含 frontmatter（`title` + `date`）。
[src/notes/index.ts](src/notes/index.ts) 使用 Vite `import.meta.glob` 自动扫描构建分类树。
Markdown 渲染是轻量自定义实现。

### 共享组件

`SectionTitle`、`Tag`、`NavBar`、`Footer`、`TypingText`、`SliderTrack` 定义在 [src/App.tsx](src/App.tsx) 中复用。

## 技术栈

- **React 19** + **TypeScript** (5.7 strict)
- **Vite 6** + **Tailwind CSS v4** (`@tailwindcss/vite` 插件)
- **Biome 1.9** — Lint + Format
- **pnpm** — 包管理器

## Git 提交规范

格式：`<type>(<scope>): <中文描述>`

- type: `feat` / `fix` / `chore` / `style` / `refactor` / `docs`
- **描述必须用中文**，一个提交只做一件事
- 不包含 Claude 签名

详见 [docs/conventional-commits.md](docs/conventional-commits.md)。

## CI/CD

GitHub Actions 工作流：推送到 `master` 时构建部署，`BASE_URL=/personal_site/`。

## 设计指南

配色、字体、间距、组件风格等设计决策在 [docs/DESIGN.md](docs/DESIGN.md)。
新增或修改 UI 时应参考该文档。
