---
title: Linux 基础入门
date: 2026-05-30
---
# Linux 基础入门

> 学习目标：掌握日常开发必需的 Linux 基础知识，包括常用命令、文件系统、权限管理和基本的环境配置。

## 常用命令

### 基础输出与信息

| 命令 | 说明 | 示例 |
|------|------|------|
| `echo` | 输出文本或变量 | |
| `whoami` | 显示当前用户名 | |
| `id` | 显示用户 UID、GID 及所属组 | `id -un`（仅输出用户名） |
| `sudo` | 以管理员权限执行后面的命令 | `sudo apt install code`（以管理员身份安装VS code） |
| `apt` | Ubuntu/Debian系统的包管理器 | `apt update`（刷新软件目录） |
|  |  |  `apt search opencv` |
|  |  |  `apt install libopencv-dev` |
|  |  |  `apt remove code` |
|  |  |  `apt upgrade` |
| `chmod` | 改变权限模式 | `chmod +x qt-online-installer-linux-x64-x.x.x.run`（修改权限-增加execute执行权限-文件名）|
|  |  |  `r` （读）
|  |  |  `w` （写）
|  |  |  `x` （执行）
| `.\` | 执行 | `.\ qt-online-installer-linux-x64-x.x.x.run` |