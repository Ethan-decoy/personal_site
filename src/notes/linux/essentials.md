---
title: Linux 基础入门
date: 2026-05-30
---
# Linux 基础入门

> 学习目标：掌握日常开发必需的 Linux 基础知识，包括常用命令、文件系统、权限管理和基本的环境配置。

## 常用命令

### 文件与目录操作

| 命令 | 说明 | 示例 |
|------|------|------|
| `ls` | 列出目录内容 | `ls -la` |
| `cd` | 切换目录 | `cd /home/user` |
| `pwd` | 显示当前路径 | `pwd` |
| `cp` | 复制文件/目录 | `cp -r src/ backup/` |
| `mv` | 移动/重命名 | `mv old.txt new.txt` |
| `rm` | 删除 | `rm -rf /path` |
| `mkdir` | 创建目录 | `mkdir -p a/b/c` |
| `touch` | 创建空文件或更新时间 | `touch file.txt` |

### 查看与编辑

| 命令 | 说明 | 示例 |
|------|------|------|
| `cat` | 查看文件内容 | `cat file.txt` |
| `less` | 分页查看 | `less logfile` |
| `head / tail` | 查看首/尾 N 行 | `tail -f log` |
| `grep` | 文本搜索 | `grep "error" log.txt` |
| `find` | 文件查找 | `find . -name "*.md"` |

### 权限管理

| 命令 | 说明 | 示例 |
|------|------|------|
| `chmod` | 修改权限 | `chmod +x script.sh` |
| `chown` | 修改所有者 | `sudo chown user:group file` |
| `sudo` | 以 root 执行 | `sudo apt update` |

### 进程与系统

| 命令 | 说明 | 示例 |
|------|------|------|
| `ps` | 查看进程 | `ps aux` |
| `top / htop` | 实时监控 | `htop` |
| `kill` | 终止进程 | `kill -9 PID` |
| `df / du` | 磁盘空间 | `df -h`、`du -sh *` |
| `free` | 内存使用 | `free -h` |

### 网络

| 命令 | 说明 | 示例 |
|------|------|------|
| `curl` | HTTP 请求 | `curl -I https://example.com` |
| `wget` | 下载文件 | `wget URL` |
| `ssh` | 远程连接 | `ssh user@host` |
| `scp` | 远程传输 | `scp file user@host:/path` |

## 文件系统结构

```
/
├── bin/      # 基础命令（用户和系统通用）
├── etc/      # 系统配置文件
├── home/     # 用户家目录
├── tmp/      # 临时文件
├── var/      # 可变数据（日志等）
└── usr/      # 用户程序和库
```

## Shell 基础

- **环境变量**：`export` 设置，`echo $VAR` 查看
- **别名**：在 `~/.bashrc` 或 `~/.zshrc` 中定义 `alias ll='ls -la'`
- **管道与重定向**：`|` 管道、`>` 覆盖、`>>` 追加、`2>&1` 合并标准错误

## 包管理

| 发行版 | 命令 |
|--------|------|
| Debian / Ubuntu | `apt install / apt update` |
| RHEL / Fedora | `dnf install / dnf update` |
| Arch | `pacman -S / pacman -Syu` |

## 学习路线

1. 熟悉基本命令操作
2. 理解 Linux 文件系统和权限模型
3. 掌握 Shell 脚本编写基础
4. 学习进程管理、网络调试
5. 深入了解 Vim / Tmux 等开发工具
