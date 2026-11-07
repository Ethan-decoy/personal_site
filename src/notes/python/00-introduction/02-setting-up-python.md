---
title: 安装 Python 与准备开发环境（Setting Up Python）
date: 2026-11-04
order: 2
---

# 安装 Python 与准备开发环境（Setting Up Python）

Python 的安装方式因操作系统而异，运行代码时还需要确定解释器版本、启动入口和编辑工具。本篇采用 CPython 3.14 与 Visual Studio Code（简称 VS Code），说明解释器的安装与核对，以及编辑器如何找到并使用它。

## 解释器与编辑器各自做什么

写程序时，需要把 Python 代码写成文本、保存成文件，也需要执行其中要求的操作。这两件事由不同的工具负责。

VS Code 用于编辑源码。Microsoft 发布的 Python 扩展（extension）为它添加代码补全、运行和调试等 Python 支持。

> [!IMPORTANT] 编辑器与解释器的分工
> **编辑器（editor）负责写下和保存源码，解释器（interpreter）负责执行源码。**VS Code 的 Python 扩展提供两者之间的集成，扩展本身不包含 Python 解释器。

## 终端与 shell

终端（terminal）是进行文字交互的窗口，其中的命令解释器（shell）接收命令、启动程序。PowerShell 是一种 shell；macOS 和 Linux 也通过各自的 shell 接收启动命令。

下列终端代码块只包含命令本身，窗口中已有的路径和提示符不属于命令。命令启动 Python 后，同一个终端窗口也可以显示 Python 的交互提示符，输入内容由当前等待输入的程序处理。

## 安装并核对 CPython 3.14

Windows 使用官方安装管理器，macOS 使用官方安装包；Linux 则需要结合发行版提供的版本准备。安装界面和补丁版本可能变化，操作时以相应官方说明为准。

### Windows

**Python install manager** 可从 [Python 官方下载页](https://www.python.org/downloads/)取得，运行安装文件即可安装。这个管理器负责取得和启动不同版本的 Python，CPython 3.14 由它另行安装。

PowerShell 可从 Windows 开始菜单打开。

在 PowerShell 中安装 CPython 3.14：

```powershell
py install 3.14
```

这条命令要求安装管理器下载并安装 CPython 3.14。已安装版本可通过以下命令核对：

```powershell
py -3.14 --version
```

`py -3.14` 选择 3.14 解释器，`--version` 要求它显示版本后退出。输出应以 `Python 3.14` 开头，末尾的补丁版本号可以不同。这说明当前入口已经能够找到并启动所需的解释器。

上述命令采用[官方安装管理器流程](https://docs.python.org/3.14/using/windows.html#python-install-manager)。如果刚安装后仍找不到 `py`，可关闭并重新打开 PowerShell；如果机器已有旧版启动器，导致 `py install` 不能识别安装操作，按[入口排查说明](https://docs.python.org/3.14/using/windows.html#troubleshooting)处理。

### macOS

从 [Python 的 macOS 下载页](https://www.python.org/downloads/macos/)选择 3.14 系列，下载 `.pkg` 安装包，打开后按提示完成安装。随后按[官方安装步骤](https://docs.python.org/3.14/using/mac.html#installation-steps)，运行 `/Applications/Python 3.14/` 中的 `Install Certificates.command` 完成证书准备。

在“终端”应用中核对版本：

```sh
python3.14 --version
```

这里通过带版本号的命令选择解释器，同样应看到以 `Python 3.14` 开头的输出。系统或其他工具提供的 `python3` 可能指向另一个版本，`python3.14` 则明确选择 3.14。

### Linux

目标版本可在终端中核对：

```sh
python3.14 --version
```

如果命令不存在，需要通过所用发行版提供的安装方式准备 3.14；具体包名与可用版本因发行版而异。发行版提供的默认 Python 可能是其他版本，安装结果仍需通过上述命令核对。

发行版仓库没有提供目标版本时，[Python 官方 Unix 安装说明](https://docs.python.org/3.14/using/unix.html#on-linux)还介绍了源码构建等路径。源码构建需要编译工具和开发依赖，具体准备与安装位置应按[官方构建要求](https://docs.python.org/3.14/using/configure.html#build-requirements)另行核对，并保留系统已有的 Python。采用额外安装方式后，同样以 `python3.14 --version` 的结果确认目标入口可用。

## 启动解释器，辨认输入位置

Windows 的 PowerShell 中使用以下命令启动 CPython 3.14：

```powershell
py -3.14
```

macOS 或 Linux 输入：

```sh
python3.14
```

不附加 `--version` 时，解释器会进入交互模式（interactive mode）。屏幕先显示版本等信息，最后出现等待输入的提示符：

```text
>>>
```

`py -3.14` 或 `python3.14` 由 shell 接收，用于启动解释器；`>>>` 后的 `quit()` 则由 Python 执行，用于退出交互会话、回到 shell。两种输入分别由不同的程序处理。`>>>` 是 Python 显示的提示符，不属于需要键入的代码。

> [!IMPORTANT] shell 命令与 Python 代码的输入位置
> **启动解释器的命令输入在 shell 中；出现 `>>>` 后，输入的内容由 Python 解释器处理。**判断该输入哪种内容，先看当前由谁等待输入。

交互环境中的结果显示还涉及[回显与程序输出](../01-source-code-and-execution/01-scripts-and-interactive-execution.md#交互回显与程序输出)的区别。

## 准备 VS Code 与 Python 扩展

从 [VS Code 官方下载页](https://code.visualstudio.com/download)取得对应操作系统的安装文件，安装后可从系统应用列表打开。各平台的安装方式见官方的 [Windows](https://code.visualstudio.com/docs/setup/windows)、[macOS](https://code.visualstudio.com/docs/setup/mac) 与 [Linux](https://code.visualstudio.com/docs/setup/linux) 说明。

VS Code 左侧的 **Extensions（扩展）**视图用于管理扩展。在其中搜索 **Python**，选择发布者为 **Microsoft**、标识为 `ms-python.python` 的扩展，使用 **Install（安装）**添加 Python 支持。菜单名称和界面位置可能随语言设置或版本变化，具体操作可查[官方扩展安装说明](https://code.visualstudio.com/docs/configure/extensions/extension-marketplace#browse-for-extensions)。

### 为工作区选择解释器

通过 **File → Open Folder** 打开一个保存源码的文件夹，这个文件夹就成为当前工作区（workspace）。工作区为相关文件和设置提供共同的范围，也让 Python 扩展能够记录这组源码使用的解释器。

在 **View → Command Palette** 打开的命令面板（Command Palette）中，运行 **Python: Select Interpreter**，从已发现的解释器中选择安装好的 CPython 3.14。列表中的版本与安装位置用于辨认具体环境；同为 3.14，也可能对应不同的安装位置。已安装的解释器没有出现在列表中时，按[官方环境发现说明](https://code.visualstudio.com/docs/python/environments#environment-discovery)核对安装位置和刷新方法。

选择之后，可在命令面板运行 **Python: Start Terminal REPL**。这个入口为当前所选解释器打开终端交互会话，版本信息应以 `Python 3.14` 开头，随后出现 `>>>`。它核对的是 Python 扩展能否启动选中的解释器；这里的输入位置与退出方式，和[终端交互会话](#启动解释器辨认输入位置)相同。

> [!IMPORTANT] 编辑器选择与命令行入口
> **Python 扩展的 Run Python File in Terminal 入口使用工作区所选的解释器；手动输入的 shell 命令则按各自的入口与配置启动程序。**核对版本与安装位置，才能判断两种方式是否使用同一个环境。

## 参考资料

- [Python 3.14：Windows 安装管理器与运行版本选择](https://docs.python.org/3.14/using/windows.html#python-install-manager)
- [Python 3.14：macOS 安装步骤](https://docs.python.org/3.14/using/mac.html#installation-steps)
- [Python 3.14：Linux 安装](https://docs.python.org/3.14/using/unix.html#on-linux)与[源码构建要求](https://docs.python.org/3.14/using/configure.html#build-requirements)
- [Python 3.14 教程：启动和退出解释器](https://docs.python.org/3.14/tutorial/interpreter.html)
- [Python 3.14 命令行：版本选项与交互入口](https://docs.python.org/3.14/using/cmdline.html)
- [VS Code：Python 工具分工与解释器选择](https://code.visualstudio.com/docs/python/python-tutorial)
- [VS Code：环境发现](https://code.visualstudio.com/docs/python/environments#environment-discovery)与[终端交互入口](https://code.visualstudio.com/docs/python/run#terminal-repl)
