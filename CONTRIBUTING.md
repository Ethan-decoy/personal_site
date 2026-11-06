# 参与维护

本仓库的工程与协作约束对人工维护和代码代理同样适用。架构、笔记、资源与工作区约束见 [AGENTS.md](AGENTS.md)。

## 开发与验证

在仓库根目录安装依赖并启动开发服务：

```sh
pnpm install --frozen-lockfile
pnpm dev
```

CI 使用 Node.js 22 和 pnpm 10；排查环境差异时以 `.github/workflows/deploy.yml` 为准。

应用、笔记加载、渲染或构建改动提交前运行 `pnpm build`，保留全部内置检查。只修改协作文档或 GitHub 模板时，检查文档链接、模板语法和 `git diff --check` 即可。`pnpm lint` 会自动修改 `src/`，执行前确认范围。

## 协作流程

1. 需要讨论范围、跟踪缺陷或跨多个提交的工作，先按 [Issue 与 PR 规范](docs/issues.md) 建立记录；小型且明确的修正可以直接提交。
2. 按 [提交规范](docs/conventional-commits.md) 组织提交；新建分支默认使用 `codex/` 前缀。保留当前工作区已有的无关修改。
3. 创建 PR 时填写仓库模板，说明实际变化、关联 Issue 和已执行的验证。PR 合并前核对最终提交信息。
4. 需要对外公布版本时，按 [Release 规范](docs/releases.md) 选择版本、验证目标提交并撰写发布说明。

仓库文件提供规则、模板和发布说明分类。目前没有 `commit-msg` 钩子或提交信息 CI 检查，提交与合并时仍须执行文档中的检查。
