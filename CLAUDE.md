# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目

个人主页（personal site / portfolio）。TypeScript + React 19 + Vite + Tailwind CSS + Biome + pnpm。路由用 TanStack Router，组件用 shadcn/ui。

## Git 提交规范

### Conventional Commits

格式：`<type>(<scope>): <中文描述>`

完整规范参见 [docs/conventional-commits.md](docs/conventional-commits.md)。

- type 范围：`feat` / `fix` / `chore` / `style` / `refactor` / `docs`
- scope 是模块范围，如 `router`、`ui`、`config`、`home` 等
- **描述必须用中文**

### 提交规则

- **描述使用中文，不包含 Claude 签名**
- 一个提交只做一件事，不同模块/功能的变更分别提交
- 不要把不相关的改动合并到同一个提交
- 提交前只暂存当前任务涉及的文件，不要用 `git add -A`

### 分支

- `master` 为主分支
- 功能开发在新分支上进行
