---
title: 认识 Python（Getting to Know Python）
date: 2026-09-23
order: 1
---

# 认识 Python（Getting to Know Python）

Python 可以从一个只有几行的小程序开始使用：计算一个结果，整理一批文件，或者把一段文字写到屏幕上。随着程序变大，同一门语言也能用来组织数据处理、网络服务和模型实验。

## 从一项系统管理需求开始

1989 年，Guido van Rossum 在荷兰的 CWI 研究机构工作，参与 Amoeba 分布式操作系统项目。团队需要编写系统管理程序，但当时的选择各有不便：用 C 编写小工具比较费事，已有的命令脚本又不容易访问 Amoeba 的系统接口。他希望有一种写起来方便、又能接上系统功能的语言。[Guido 的回忆](https://docs.python.org/3.14/faq/general.html#why-was-python-created-in-the-first-place)介绍了这段工作背景。

Guido 此前参与过教学语言 ABC 的实现。他喜欢 ABC 清楚的排版和方便处理数据的能力，也遇到过它难以扩展的限制。设计 Python 时，他希望保留容易阅读的一面，同时让语言能够接入新的功能。[《Programming Python》序言](https://www.python.org/doc/essays/foreword/)回顾了这些取舍。

1989 年圣诞假期，Guido 开始动手实现这门新语言。经过一年多的开发，他在 1991 年 2 月把 Python 发布到网络上；同事和早期使用者的反馈，也参与塑造了它。[官方 FAQ](https://docs.python.org/3.14/faq/general.html#why-was-python-created-in-the-first-place)记录了这段过程。

这段出身能帮助理解 Python 的一个长处：把实际工作中的步骤写成程序，并与已有工具连接起来。今天处理文件、调用库和组织实验，仍然能用到这样的能力。

## Python 这个名字从哪里来

Python 在英语中是“蟒蛇”，不过语言名称取自英国喜剧节目 *Monty Python's Flying Circus*。Guido 当时正在阅读这部节目的剧本，觉得 Python 简短、特别，便选用了这个名字。[官方 FAQ](https://docs.python.org/3.14/faq/general.html#why-is-it-called-python)也特地收录了这个命名故事。

## 容易动手，也重视代码的可读性

Python 提供了很直接的尝试方式：可以保存一小段程序再运行，也可以进入交互环境，输入一个计算，马上查看结果。这让检查一个想法、试用一个函数都比较方便。它也能调用其他语言编写的扩展库，把现成的功能组合进自己的程序。[官方教程的开篇](https://docs.python.org/3.14/tutorial/appetite.html)就从这些日常使用需求谈起。

另一个很容易注意到的特点是缩进。许多语言也会把属于同一组的语句排得整齐，Python 则让这份排版本身参与表示程序结构。读者看到的层级与解释器识别的层级因此有了直接联系。Guido 在[设计回忆](https://www.python.org/doc/essays/foreword/)中把这种选择与代码可读性联系起来；具体规则会在[缩进一节](../01-source-code-and-execution/03-tokens-indentation-and-comments.md#缩进决定语句归属)通过短程序说明。

社区中还有一份由 Tim Peters 写下的《Python 之禅》（The Zen of Python），收录在 [PEP 20](https://peps.python.org/pep-0020/) 中。它谈到可读性、明确表达和实用取舍，反映了这门语言的一些设计倾向。这类文字适合帮助认识 Python；某种写法是否合法、具体怎样执行，仍要看语言规则。

## 语言规则与具体实现

日常说“电脑上装了 Python”，通常是指装好了能够运行 Python 代码的软件；语言本身与执行它的软件仍有区别。

编程语言（programming language）规定怎样写代码，以及这些代码表达什么行为。合法的结构属于语法（syntax），结构所表达的含义属于语义（semantics）。Python 的语言参考（Language Reference）描述这些规则。

规则需要由软件来落实，这样的软件称为实现（implementation）。解释器（interpreter）负责读取和执行 Python 程序，是我们运行代码时使用的入口。

> [!IMPORTANT] Python 与 CPython
> **Python 是编程语言，CPython 是它的参考实现。**CPython 主要用 C 编写；使用它运行普通 Python 程序，不要求先学习 C。

同一门语言可以有不同实现。它们可以采用不同的内部结构和优化方式，也可能支持不同的语言版本。官方文档中的 `CPython implementation detail` 标记，说明相应行为依赖 CPython 的具体做法，使用其他实现时需要另行核对。

## 标准库与第三方包

编写程序时，许多通用操作已有现成的功能可用，例如处理文本、访问文件和取得系统信息。Python 随附的这类功能组成标准库（standard library），其用法与行为由标准库参考（Library Reference）说明。

标准库之外的功能通常以第三方包（third-party package）的形式提供。这里的“包”指可以分发和安装的一组功能。程序运行时需要用到的其他软件或库，称为它的依赖（dependency）。

> [!IMPORTANT] 标准库与第三方包
> **标准库随 Python 提供，第三方包需要另行准备。**PyTorch 属于后者，装好 Python 解释器并不会使它自动可用。

语言规则与库的用法也需要分别判断。Python 规定函数调用怎样表达，某个库则规定它提供的函数具体完成什么工作、接受什么输入。解释库操作时，应查这个库的文档及适用版本。

## 运行环境决定哪些能力实际可用

运行环境（runtime environment）包括实际使用的解释器、可用的库，以及影响程序运行的平台和配置。程序需要某个库时，解释器会按照当前环境的配置寻找它。第三方包通常安装在某个环境对应的位置；换一个环境运行，相应的查找位置也可能改变。

例如，同一台电脑上可以为两个项目分别准备环境。若它们的第三方包彼此隔离，在环境 A 中安装 PyTorch，就不会让环境 B 自动获得 PyTorch。B 中的程序需要它时，仍须为 B 准备相应依赖。

终端里的 `python`、`python3` 或 `py` 是启动命令，它们怎样找到解释器取决于安装方式和配置。两个地方都输入了 `python`，仍可能启动不同的解释器，不能只凭命令的拼写判断入口相同。

> [!IMPORTANT] 包的可用性取决于实际环境
> **包是否可用，要看程序实际运行的环境。**核对依赖时，既要知道包安装在哪里，也要确认程序由哪个解释器运行；命令同名不能代替这些核对。

## Python 2 与 Python 3

查找资料时，有时还会遇到 Python 2。Python 3.0 于 **2008 年 12 月**发布，包含一些有意打破旧版本兼容性的调整，希望借此改进长期存在的设计问题。因此，某些 Python 2 程序不能直接交给 Python 3 运行。[Python 3.0 的更新说明](https://docs.python.org/3.14/whatsnew/3.0.html)介绍了这次转变。

例如，Python 2 的旧资料中可能出现 `print "Hello"`，Python 3 中对应的写法是 `print("Hello")`。两者都是把 `Hello` 输出到屏幕上，但后者把 `print` 当作函数来调用，括号是调用写法的一部分。遇到这种差异时，先核对文章针对的版本，便容易理解它为什么那样写。

Python 官方对 Python 2 的支持已于 **2020 年 1 月 1 日**结束，背景见[官方说明](https://www.python.org/doc/sunset-python-2/)。本书使用 Python 3，不要求同时学习两套写法；这段历史主要帮助辨认旧资料。

## 本书采用 Python 3.14 与 CPython

本套笔记以 **Python 3.14** 为语言参考基线，基础语言示例默认使用 **CPython 3.14**。这使正文中的规则、示例和参考资料有明确的版本依据；结论若依赖某个补丁版本或特定构建，会在相应位置注明。

应用项目还需要满足所用库的兼容要求。例如，视觉项目应结合 PyTorch 等依赖、操作系统和计算设备选择 Python，并记录实际组合。书页的语言基线用于解释规则，项目的运行环境则按实际需求核对。

选择或更换环境时，应查实现及所用依赖的官方支持说明。实现自己的版本号也可能不同于它支持的 Python 语言版本，不能只比较安装包名称中的数字。

## 参考资料

- [Guido van Rossum：为《Programming Python》初版所写的序言](https://www.python.org/doc/essays/foreword/)
- [Python 3.14 FAQ：诞生背景与命名来由](https://docs.python.org/3.14/faq/general.html)
- [Python 3.14 教程：使用 Python 的日常需求](https://docs.python.org/3.14/tutorial/appetite.html)
- [PEP 20：Python 之禅](https://peps.python.org/pep-0020/)
- [Python 3.0 更新说明](https://docs.python.org/3.14/whatsnew/3.0.html)与[Python 2 停止支持说明](https://www.python.org/doc/sunset-python-2/)
- [Python 3.14 语言参考：语言与实现](https://docs.python.org/3.14/reference/introduction.html)
- [Python 3.14 标准库参考：标准库的范围与平台条件](https://docs.python.org/3.14/library/index.html)
- [Python 3.14 标准库：实现版本与语言版本](https://docs.python.org/3.14/library/sys.html#sys.implementation)
- [Python 3.14 教程：虚拟环境与包](https://docs.python.org/3.14/tutorial/venv.html)
