# C++ 开发工具流行度与定位核查

核查日期：2026-08-08

## 结论

可以把 Visual Studio Code 描述为“当前使用最广的开发环境或代码编辑器之一”，在这两份最新且口径不同的调查中，它都位列第一：

- Stack Overflow 2025 开发者调查将 IDE、开发环境和 AI 代码编辑工具放在同一问题中统计，并明确称 VS Code 已连续五年成为使用最多、同时也是最受期待的工具。该调查面向所有开发者，而非专门面向 C++。
- JetBrains 2025 C++ 专项报告询问“最常用于 C++ 开发的 IDE 或编辑器”，VS Code 以 33% 位列第一，其后是 CLion（23%）和 Visual Studio（21%）。

不过，“使用人数最多”不能改写成“客观上最好用”，也不宜不加限定地称它为“排名第一的 IDE”。微软将 VS Code 定位为精简的代码编辑器；它可以通过扩展获得接近 IDE 的 C++ 开发体验，但 C++ 扩展本身不包含编译器或调试器。

因此，更严谨的笔记表述是：

> VS Code 是目前使用最广泛的开发环境之一，在最新的 C++ 专项调查中也是最常用的 IDE 或编辑器。严格来说，它首先是一款可扩展的代码编辑器；要用它开发 C++，还需要另外安装编译器和调试器。

## 调查证据

### 全体开发者：Stack Overflow 2025

[Stack Overflow 2025 技术调查](https://survey.stackoverflow.co/2025/technology)询问受访者过去一年经常使用过哪些“开发环境和 AI 代码编辑工具”，允许多选。其结果页称：

- Visual Studio Code 已连续五年是使用最多的 IDE，并持续位列最受期待的 IDE；
- Visual Studio Code 与 Visual Studio 连续第四年保持开发环境使用量前两位；
- 此题共有 26,143 人回答，占完整样本的 53.3%。

这能支持“VS Code 在整个开发者群体中使用最广”，但不能直接推出“它是 C++ 开发者使用最多的工具”，因为结果没有按编程语言交叉筛选，而且问题允许一人选择多个工具。

[调查方法](https://survey.stackoverflow.co/2025/methodology/)显示，2025 年结果包含来自 177 个国家的 49,009 份答卷，调查时间为 2025-05-29 至 2025-06-23。受访者主要通过 Stack Overflow 自有渠道招募，因此活跃的 Stack Overflow 用户更容易进入样本。2026 年调查在 2026-06-23 才[正式开放](https://stackoverflow.blog/2026/06/23/the-2026-developer-survey-is-now-open-for-human-developers-only/)，截至本次核查尚无正式结果，所以 2025 年仍是最新可用的年度结果。

### C++ 开发者：JetBrains 2025

[The State of C++ 2025](https://lp.jetbrains.com/the-state-of-cpp-2025/)基于 22 个国家的 1,800 名 C++ 开发者，询问其“最常用于 C++ 开发的 IDE 或编辑器”。公开结果为：

| 工具 | 比例 |
| --- | ---: |
| Visual Studio Code | 33% |
| CLion | 23% |
| Visual Studio | 21% |
| Vi / Vim | 4% |
| Qt Creator | 4% |
| Rider | 3% |
| Eclipse CDT | 2% |

VS Code、CLion 和 Visual Studio 合计超过四分之三。Code::Blocks 没有出现在页面公开列出的前七项中，因此可以说它明显不属于该样本的主流前三，但不能仅凭未展示的数据断言其精确占比或使用体验。

这份报告也主动提示：尽管做了代表性校正，JetBrains 用户仍可能更愿意参加调查，结果可能略向 JetBrains 产品倾斜。[JetBrains 2025 总报告](https://devecosystem-2025.jetbrains.com/)还说明完整调查包含 24,534 名开发者，并按地域、就业情况、编程语言和 JetBrains 产品使用情况进行了平衡。因此，这些数字是调查样本中的使用比例，不是全球安装量或绝对市场份额。

## 三款工具不能只按“好不好用”比较

### Visual Studio Code

[微软官方 C++ 文档](https://code.visualstudio.com/docs/languages/cpp/)明确说明，VS Code 的 C++ 支持来自扩展；该扩展提供语法高亮、智能补全、悬停信息和错误检查，但不包含 C++ 编译器或调试器。开发者需要另外安装 MSVC、GCC 或 Clang 等命令行工具并完成连接配置。

[微软 FAQ](https://code.visualstudio.com/docs/supporting/FAQ#_what-is-the-difference-between-visual-studio-code-and-visual-studio-ide)把 VS Code 称为精简的代码编辑器：它支持调试、任务运行和版本控制，但把更复杂的工作流留给功能更完整的 IDE。

由此可以客观得出：它轻量、跨平台且扩展性强，同时也要求使用者理解并组装编辑器、扩展、编译器、调试器和构建配置。后一项既可能是学习工具链的优点，也可能增加初次配置成本。

### Visual Studio

[Microsoft Learn](https://learn.microsoft.com/en-us/cpp/ide/using-the-visual-studio-ide-for-cpp-desktop-development?view=msvc-170)将 Visual Studio 明确定义为完整 IDE，可用于管理项目、编写与重构代码、静态分析和调试。安装“使用 C++ 的桌面开发”工作负载后，会一并安装所需的 C++ 编译器、工具和库。

[Visual Studio C++ 产品页](https://visualstudio.microsoft.com/vs/features/cplusplus/)还列出 MSVC、Clang、CMake、MSBuild、远程 Linux 调试和性能诊断等集成功能。因此，对 Windows 上希望尽快获得完整工具链的人而言，它减少了组件拼装；相应地，它比精简编辑器更庞大，并以 Windows 为主要宿主平台。这是产品取向差异，不是“难用”或“过时”的证据。

### Code::Blocks

Code::Blocks 仍是维护中的开源、跨平台 C/C++ IDE，而不是已经停止开发的旧软件。[官方更新记录](https://www.codeblocks.org/changelogs/)显示当前稳定版本 25.03 发布于 2025-03-31，上一稳定版为 20.03。

[官方下载页](https://www.codeblocks.org/downloads/binaries/)同时提供普通安装包和带工具链的 Windows 安装包；`codeblocks-25.03mingw-setup.exe` 包含 GCC/G++/GFortran/Clang 编译器与 GDB 调试器。也就是说，“Code::Blocks 是否自带编译器”取决于具体发行包，而不是 IDE 本体必然包含编译器。

现有调查只能支持它的主流程度低于 VS Code、CLion 和 Visual Studio，不能支持“它客观上不好用”。它仍可能适合课程统一环境、较小项目或偏好传统工程界面的使用者。

## IDE 与编译器必须分开选择

JetBrains 的同一份 C++ 报告还统计了经常使用的编译器：GCC 为 70%、Clang 为 45%、MSVC 为 27%，该题允许受访者使用多个编译器。这反映跨平台 C++ 项目中常见的工具分布，却不构成所有平台上的统一推荐。

三种典型组合是：

- VS Code + MSVC、GCC 或 Clang：编辑器和工具链彼此独立；
- Visual Studio + MSVC（也可连接 Clang、CMake 等工具）：完整 IDE 与工具链高度集成；
- Code::Blocks + 外部编译器，或选择附带 MinGW 工具链的发行包。

因此，教学内容最好先解释 IDE（或编辑器）与编译器的职责，再给出一套本课程实际采用的组合。流行度可以帮助选择一个读者容易获得支持的默认方案，但最终还应考虑操作系统、课程是否希望展示底层编译过程、配置成本以及未来项目类型。

## 对正文的建议

不建议写：

> VS Code 是目前排名第一、最好用的 C++ IDE，Visual Studio 和 Code::Blocks 都不太好用。

建议写：

> 开发工具没有脱离使用场景的统一优劣。就使用范围而言，VS Code 是当前最主流的选择之一，并在 2025 年 C++ 开发者专项调查中位列第一。它本质上是一款可扩展的代码编辑器，不自带 C++ 编译器；Visual Studio 则提供更完整的一体化环境，Code::Blocks 也仍是可用的跨平台 IDE。接下来，我们先分清编辑器、IDE 与编译器各自负责什么，再选择本课程实际使用的组合。
