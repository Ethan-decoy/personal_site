# C++ 注释规范与工具识别调研

调研日期：2026-08-13

## 核心结论

### C++ 标准只规定两种注释语法

C++ 工作草案的 [Comments `[lex.comment]`](https://eel.is/c%2B%2Bdraft/lex.comment) 只定义了两种语言级注释：

- `// ...`：从 `//` 开始，在下一个换行符之前结束；
- `/* ... */`：从 `/*` 开始，在随后遇到的 `*/` 处结束，而且不能嵌套。

因此，`///`、`//!`、`/** ... */` 和 `/*! ... */` 并不是 C++ 增加的四种注释语法。从语言规则看，`///` 与 `//!` 仍然是 `//` 注释，`/** ... */` 与 `/*! ... */` 仍然是 `/* ... */` 注释；额外字符只是注释内容的一部分。它们之所以具有特殊意义，是因为 Doxygen、Clang 等工具在语言语法之上约定了文档注释（documentation comment）的识别方式。

### Doxygen 支持四组前置文档注释

[Doxygen 的 Special comment blocks](https://www.doxygen.nl/manual/docblocks.html#specialblock) 为 C/C++ 风格源代码支持以下常用形式：

| 写法 | Doxygen 中的来源或名称 | 典型位置 |
|---|---|---|
| `/// ...` | C++ 风格文档注释 | 被说明的声明之前 |
| `//! ...` | C++/Qt 风格文档注释 | 被说明的声明之前 |
| `/** ... */` | Javadoc 风格文档块 | 被说明的声明之前 |
| `/*! ... */` | Qt 风格文档块 | 被说明的声明之前 |

连续的 `///` 或 `//!` 行可以组成一段文档注释；空行会结束这种文档块。`/** ... */` 与 `/*! ... */` 适合容纳多段内容，中间每行开头用于排版的 `*` 可以省略。Doxygen 对这些形式都提供支持，但一个项目通常应选择一种风格并保持一致，而不是在同一代码库中任意混用。

Doxygen 还允许在成员或参数之后添加 `<`，把注释绑定到它前面的实体。[Putting documentation after members](https://www.doxygen.nl/manual/docblocks.html#memberdoc) 给出的完整常用形式是：

```cpp
int retry_limit;  ///< Brief description after the member.
int timeout_ms;   //!< Brief description after the member.
int sample_count; /**< Detailed description after the member. */
int channel_count; /*!< Detailed description after the member. */
```

也就是说，对应的尾随形式为 `///<`、`//!<`、`/**< ... */` 和 `/*!< ... */`。Doxygen 明确限制这类尾随文档块用于成员和参数，不能用它们说明文件、类、结构体、命名空间、宏或枚举本身。对于主要接口，前置文档注释通常更容易容纳完整说明；尾随形式更适合简短的成员或枚举值说明。

### Clang 能识别这些文档注释，clangd 能把它们显示在编辑器中

Clang 的官方源代码将原始注释区分为普通 `//`、普通 `/* */`，以及 `///`、`//!`、`/** */`、`/*! */` 四类文档注释；同一实现还明确识别 `///<`、`//!<`、`/**< */`、`/*!< */` 为尾随文档注释。对应枚举与判断可见 [`RawCommentList.h`](https://clang.llvm.org/doxygen/RawCommentList_8h_source.html#l00034)。这说明这些形式不是 Doxygen 单独发明后只能由 Doxygen 使用，Clang 的注释解析器也理解同一套常见约定。

[clangd 的功能文档](https://clangd.llvm.org/features#documentation-parsing) 说明，鼠标悬停在符号上时可以显示类型、定义和文档，并支持解析 Markdown 与 Doxygen 文档注释。[clangd 配置文档的 `Documentation.CommentFormat`](https://clangd.llvm.org/config#commentformat) 进一步说明，这项设置会影响 hover 与代码补全返回的文档内容：

- `Plaintext`：按普通文本解释；
- `Markdown`：按 Markdown 解释；
- `Doxygen`：使用 Clang 的 Doxygen 解析器，在 Markdown 基础上识别 Doxygen 命令，并扩展参数、返回值等 hover 信息。

需要富 Doxygen 展示时，可以在项目 `.clangd` 中配置：

```yaml
Documentation:
  CommentFormat: Doxygen
```

这项配置改变的是编辑器如何解释和呈现文档，不改变 C++ 程序本身的语义。

在风格选择上，[LLVM Coding Standards 的 Comment Formatting](https://llvm.org/docs/CodingStandards.html#comment-formatting) 明确建议普通注释使用 `//`，Doxygen 文档注释使用 `///`；其 [Doxygen Use in Documentation Comments](https://llvm.org/docs/CodingStandards.html#doxygen-use-in-documentation-comments) 也以 `///` 展示接口说明、`\param` 和 `\returns`。由于当前笔记已经采用 C++ 风格行注释，正文最适合推荐这一组：

```cpp
// 解释实现选择、约束或非显然原因。

/// 说明紧随其后的接口或声明。
```

`/** ... */` 仍然是完全有效且常见的多行文档形式，但不需要因为 Doxygen 同时支持多种写法，就把它们全部作为日常首选。

### `TODO` 与 `FIXME` 是约定，不是 C++ 注释语法

C++ 标准只识别注释的起止符，不为注释文本中的 `TODO` 或 `FIXME` 规定任何含义。因此：

```cpp
// TODO: Replace the temporary fallback.
// FIXME: Incorrect when the input is empty.
```

从语言角度看只是两条普通行注释。编辑器扩展、静态检查器或项目脚本是否高亮、收集或校验它们，取决于相应工具和项目约定。

`TODO` 确实有成熟的工程约定。[Google C++ Style Guide 的 TODO Comments](https://google.github.io/styleguide/cppguide.html#TODO_Comments) 要求 `TODO` 使用大写，并附带问题编号、责任人或其他可追踪标识；[clang-tidy 的 `google-readability-todo`](https://clang.llvm.org/extra/clang-tidy/checks/google/readability-todo.html) 会检查缺少用户名或 bug 编号的 TODO 注释。Doxygen 还另外提供 [`\todo` 命令](https://www.doxygen.nl/manual/commands.html#cmdtodo)，可以把任务汇总到生成文档的 Todo list 中。`// TODO:` 与 `\todo` 不是同一层面的机制。

`FIXME` 同样不是 C++ 标准的一部分，也没有跨工具统一的语言级含义。某些编辑器会把它理解为比 TODO 更紧迫的问题，但这属于工具或团队定义，不宜在基础 C++ 笔记中写成“标准写法”。

当前入门文章可以用一句话说明 `TODO`、`FIXME` 等标签可能被工具识别，但不必展开任务管理规范。若要给出 `TODO` 示例，应至少包含可追踪对象和完成条件，避免留下无法归属、无法判断何时删除的永久注释。

## 对现有文章的补充建议

在“行注释”和“块注释”之后新增“普通注释与文档注释”小节最自然。正文应先守住语言与工具的边界，再给出项目可执行的选择：

> C++ 标准只规定 `//` 与 `/* ... */` 两种注释语法。在这两种语法之上，文档工具还会识别带有额外标记的文档注释（documentation comment）。例如，普通的 `//` 适合解释实现中的原因和约束，而 `///` 可以为紧随其后的声明提供结构化文档；clangd 等工具能够把这类文档显示在补全与鼠标悬停信息中。

接着给出一组简单对照即可：

```cpp
// 传感器改变曝光后需要 250 ms 才能进入稳定状态。
int settling_time_ms{250};

/// 返回当前传感器是否已经进入稳定状态。
bool is_sensor_stable();
```

然后补充一段边界说明：

> Doxygen 也支持 `//!`、`/** ... */` 与 `/*! ... */`，并支持在成员之后使用 `///<`、`//!<`、`/**< ... */` 或 `/*!< ... */`。这些都是工具约定，而不是新的 C++ 注释语法。一个项目应选定一致的文档风格；采用 clangd 的现代 C++ 项目可以优先使用 `///`，普通实现注释仍使用 `//`。

若担心这一节对初学者信息过多，可以把尾随形式压缩为一行链接，不在正文逐一演示。当前文章没有讲函数和公共 API，因此不宜提前展开 `\param`、`\returns`、`\brief`、文件文档和 Doxygen 配置；这些内容更适合在函数、接口与工程文档章节出现。此处只需让读者建立三个层次：

1. C++ 语言识别两种注释；
2. 工具可以在两种语法上识别文档注释；
3. 普通注释解释实现，文档注释说明可被使用的接口。

## 参考资料

- [C++ 工作草案：Comments `[lex.comment]`](https://eel.is/c%2B%2Bdraft/lex.comment)
- [Doxygen：Special comment blocks](https://www.doxygen.nl/manual/docblocks.html#specialblock)
- [Doxygen：Putting documentation after members](https://www.doxygen.nl/manual/docblocks.html#memberdoc)
- [Doxygen：`\todo` command](https://www.doxygen.nl/manual/commands.html#cmdtodo)
- [Clang：`RawCommentList.h`](https://clang.llvm.org/doxygen/RawCommentList_8h_source.html#l00034)
- [clangd：Documentation Parsing](https://clangd.llvm.org/features#documentation-parsing)
- [clangd：`Documentation.CommentFormat`](https://clangd.llvm.org/config#commentformat)
- [LLVM Coding Standards：Comment Formatting](https://llvm.org/docs/CodingStandards.html#comment-formatting)
- [LLVM Coding Standards：Doxygen Use in Documentation Comments](https://llvm.org/docs/CodingStandards.html#doxygen-use-in-documentation-comments)
- [Google C++ Style Guide：TODO Comments](https://google.github.io/styleguide/cppguide.html#TODO_Comments)
- [clang-tidy：`google-readability-todo`](https://clang.llvm.org/extra/clang-tidy/checks/google/readability-todo.html)
