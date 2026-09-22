# AGENTS.md

本文件是本仓库的维护事实源，为 Codex 等代码代理提供工作约束。修改架构、脚本、部署路径或主题系统后，应同步更新本文件。

## 项目概述

个人主页（portfolio），技术栈为 TypeScript、React 19、Vite、Tailwind CSS v4、Biome 与 pnpm。

- 生产环境：GitHub Pages
- 自定义域名：`www.ethan-chen.me`（见 `public/CNAME`）
- 生产构建基础路径：`/`
- 应用形态：基于 Hash 的单页应用

## 常用命令

所有命令在仓库根目录执行：

| 命令 | 作用 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 类型检查、项目检查脚本与生产构建 |
| `pnpm preview` | 预览生产构建 |
| `pnpm lint` | 使用 Biome 检查并自动修改 `src/` |
| `pnpm format` | 使用 Biome 格式化 `src/` |
| `pnpm install` | 安装依赖 |

本项目没有通用测试框架，但 `scripts/check-*.mjs` 是必须保留的构建检查；`pnpm build` 会运行它们。

## 架构概览

### 应用入口与页面

- `src/main.tsx`：挂载 React 应用。
- `src/App.tsx`：管理当前路由、About 子视图、主题、导航和跨页状态。
- `src/page-modules.ts`：定义页面级懒加载、导航预取和空闲时预加载。
- `src/components.tsx`：共享导航、页脚、章节标题和主题/语言切换控件。

页面分别位于：

- `src/pages/home.tsx` — 首页；包含笑脸刻印、眼睛跟随与眨眼彩蛋。
- `src/pages/about.tsx` — 关于页外壳与工作面。
- `src/pages/about-personal.tsx` — 生活面；包含近来、相信、娱乐及图片轮播。
- `src/pages/projects.tsx` — 项目页；渲染 GitHub 贡献图与项目占位信息。
- `src/pages/notes.tsx` — 笔记页；包含分类树、搜索、阅读区与滚动进度。
- `src/pages/contact.tsx` — 联系页；包含同步打字效果。

首页同步进入首包，其余主要页面通过 `React.lazy` 分包。新增页面时，应同时检查：

1. `src/themes.ts` 中的 `Section` 类型；
2. `src/App.tsx` 中的 `sections`、页面映射和主题映射；
3. `src/page-modules.ts` 中的加载器与预取逻辑；
4. `src/components.tsx` 中的导航入口。

About 页面有独立的 personal/work 分支，不应机械塞入普通页面映射。

生活面的「在看」由 `src/pages/about-personal.tsx` 中的 `WATCHING_COLLECTIONS` 按观看年份维护，最新年份在前；新增剧集或调整展示时，遵循 `docs/DESIGN.md` 的「在看的年度收纳」约定。

### 路由

路由使用 URL Hash，例如：

- `#home`
- `#about/personal`
- `#about/work`
- `#projects`
- `#notes`
- `#contact`

初始化从 `window.location.hash` 读取；站内导航使用 `history.replaceState`。工作面、生活面和娱乐子索引状态保存在 `App` 中，因此站内切走再返回时不应重置。

### 主题系统

主题色值和类型统一定义在 `src/themes.ts`。普通页面通过 `getTheme` 获取主题，About 通过 `getAboutTheme` 获取生活/工作专用主题。

| 页面 | 主题 | 氛围 |
|------|------|------|
| Home | `sage` | 青瓷纸面 / 松烟夜色 |
| About · Personal | 专用生活主题 | 暖灰生活纸 / 暮色生活页 |
| About · Work | 专用工作主题 | 冷灰工作纸 / 冷钢石墨 |
| Projects | `github` | GitHub 冷白 / 深色工程图版 |
| Notes | `ocean` | 日光工程手稿 / 石墨深海 |
| Contact | `contact` | 雾墨落款 / 夜墨落款 |

页面切换依靠共享排版、导航、页脚和 300ms 全局颜色过渡维持统一性，不应把所有页面强行改成同一种底色。具体视觉决策见 `docs/DESIGN.md`。

## 笔记系统

笔记 Markdown 位于 `src/notes/`，公开笔记需要 frontmatter：

- `title`
- `date`
- 可选 `order`
- 目录 `_index.md` 可选 `sidebarAfter`，使用相对 Markdown 路径声明该目录在侧栏中跟随的同级正文
- 目录索引可选 `sidebarGroups: headings`，以正文二级标题及其列表中的直属子目录 `_index.md` 链接定义逻辑分篇；启用后，每个子目录必须恰好归属一篇，目录下只放子目录和索引。

以下划线开头的目录是内部草稿或测试内容，不进入公开目录、搜索索引或生产 JavaScript。

笔记加载分为三层：

1. `scripts/notes-manifest-plugin.ts` 在构建期扫描公开 Markdown，生成 `virtual:notes-manifest`；`virtual:notes-search-index` 在搜索时并行加载按序列化大小划分的索引块，合并完整正文索引。开发时 Markdown 修改会使索引快照及全部分块失效，新增或删除文件会刷新目录和分块清单。
2. `src/notes/index.ts` 使用 `import.meta.glob` 为公开正文建立按文件懒加载器，并构造目录树。逻辑分篇保留正文路径，搜索分类与自动展开路径均由实际侧栏树生成。
3. `src/notes-renderer.tsx` 使用 React Markdown、GFM、KaTeX 与语法高亮渲染正文。

正文跨篇引用由 `src/use-note-peek.ts` 管理悬停、聚焦与关闭延迟，通过 `src/note-peek.tsx` 按需打开速览；`src/note-excerpt.ts` 在标题 slug 生成后提取小节并隔离预览 ID。修改引用交互或提取规则时，遵循 `docs/DESIGN.md` 的「笔记引用速览」，并保留 `scripts/check-markdown-renderer.mjs` 中的速览检查。

C++ 正文的概念引用应指向目标小节的实际标题锚点，目录导航和明确的「返回主线」保留全文入口。修改相关链接或标题后，运行 `pnpm check:cpp-links`；该检查使用页面实际渲染的锚点验证公开 C++ 笔记中的站内链接，已纳入构建。

规划 C++ 新章、调整分篇或审阅全书覆盖时，核对 `src/notes/cpp/_guidelines/book-structure.md` 的已有范围、依赖与缺口；正文构造遵循同目录的 `writing-style.md`。

Markdown 重点提示使用 `> [!TYPE] 可选标题`，在正文中直接展开。提示块语法与 C++ 笔记使用建议见 `src/notes/cpp/_guidelines/markdown-callouts.md`；调整视觉时参照 `docs/DESIGN.md` 的 Markdown 文档排版约定。

不要把全部 Markdown 正文重新打入首包。修改目录、搜索或渲染逻辑后，至少运行 `pnpm build`，确保 Markdown、侧栏、性能预算和私有目录泄漏检查全部通过。

## 图片与性能

- 线上静态资源放在 `public/assets/`，代码通过 `import.meta.env.BASE_URL` 构造 URL。
- `src/image-resources.ts` 负责图片请求去重、解码完成判定和网络感知预热。
- About 图片在页面模块加载后按需预取；不要重新把大图作为首页阻塞资源。
- `scripts/check-performance-budget.mjs` 约束首包和最大分包体积。
- `scripts/check-image-resources.mjs` 检查图片缓存、优先级升级、解码和失败重试。

新增图片前应优先压缩为适合网页的尺寸与格式，并确认不会制造重复母版或未引用的 `public` 资源。

## 构建检查

`pnpm build` 当前依次执行：

1. `tsc -b`
2. Markdown 渲染检查
3. C++ 笔记链接与锚点检查
4. 笔记侧栏检查
5. 项目页贡献图检查
6. Vite 生产构建
7. 性能预算检查
8. 图片资源检查

`tsconfig.tsbuildinfo` 是生成文件，已由 `.gitignore` 排除，不应提交。

## Git 与工作区约束

- 提交格式：`<type>(<scope>): <中文描述>`。
- type 使用 `feat`、`fix`、`chore`、`style`、`refactor` 或 `docs`。
- 一个提交只做一件事，不包含 Codex 签名。
- 详细规范见 `docs/conventional-commits.md`。
- 工作区可能存在尚未审阅的笔记、研究草稿或用户修改；除非任务明确要求，不得加入、删除、格式化或提交这些内容。
- 不要因为构建更新了生成文件而覆盖用户改动。

## CI/CD

`.github/workflows/deploy.yml` 在推送到 `master` 时：

1. 安装依赖；
2. 刷新 GitHub 贡献快照；
3. 以 `BASE_URL=/` 构建；
4. 上传并部署 `dist/` 到 GitHub Pages。

贡献数据刷新失败时，仓库中的最后有效快照仍应可用于构建，避免第三方状态导致页面空白。
