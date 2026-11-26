# 笔记系统维护

用于笔记接入、目录调整，以及清单、搜索、加载和渲染的共享功能维护。各学科的内容规划、写作、代码与来源约定按 [AGENTS.md](../AGENTS.md) 中的专题入口查阅。视觉与交互行为由 [设计指南](DESIGN.md) 维护。

## 公开边界与目录接入

笔记 Markdown 位于 `src/notes/`。公开目录只接入已有内容。以下划线开头的目录用于内部规范、研究、草稿或测试。公开清单排除这些目录、点号开头的隐藏路径及 `node_modules/`，保留公开目录中的 `_index.md`。

公开文件的 frontmatter 提供 `title`、`date`，可选 `order` 覆盖默认排序。目录 `_index.md` 还支持：

| 字段 | 约定 |
| --- | --- |
| `sidebarAfter` | 使用相对该索引的 Markdown 路径，声明目录跟随哪篇同级正文 |
| `sidebarGroups: headings` | 以二级标题定义分组，可选三级标题定义子分组；直属子目录的 `_index.md` 链接声明归属 |

启用分组时，同一标题下使用子分组或目录链接中的一种；每个直属子目录必须恰好归属一组，目录中只放子目录与索引。分组层级与顺序以总目录实际标题为准，不固定分篇数量。

逻辑分篇保留正文路径。搜索分类与自动展开路径由实际侧栏树生成，调整分组时一并核对。仅含公开 `_index.md` 的分类仍保留侧栏入口，可打开概览，正文计数为 0。目录的交互与显示规则见 [笔记目录交互](DESIGN.md#25-笔记目录交互)。

## 清单、搜索与正文加载

构建插件扫描一次公开 Markdown，从同一份文件清单生成元数据、按篇加载函数与搜索索引。

| 入口 | 职责与维护边界 |
| --- | --- |
| [notes-manifest-plugin.ts](../scripts/notes-manifest-plugin.ts) | `virtual:notes-manifest` 提供元数据与按篇加载函数。`virtual:notes-search-index` 在搜索时并行加载按序列化大小划分的分块 |
| [notes/index.ts](../src/notes/index.ts) | 从元数据构造目录树，打开文章时调用对应的加载函数。链接检查从同一公开目录确定检查范围 |
| [notes-renderer.tsx](../src/notes-renderer.tsx) | 复用预生成的文档树，渲染正文、引用速览和交互组件 |
| [notes-highlighting.ts](../scripts/notes-highlighting.ts) | 在构建或开发服务中预处理单篇 Markdown、锚点、公式及 Shiki 双主题高亮 |

开发时，修改公开笔记会使清单快照和已加载的搜索分块失效。新增或删除公开文件时，先使这些模块失效，再通知页面刷新。[check-notes-manifest.mjs](../scripts/check-notes-manifest.mjs) 使用实际笔记模块验证目录、正文加载与搜索同步更新。

保留正文按篇加载、搜索索引按需分块的边界，避免把全部 Markdown 重新打入首包。

文档树、KaTeX 公式和双主题高亮随当篇正文加载。正文与引用速览使用相同的文档树，代码参考窗复用高亮结果。代码块继续使用 Markdown 围栏声明语言，空语言或 Shiki 未收录的语言按纯文本呈现。

## 渲染与共享交互

修改这些功能时，连同设计约定与既有检查一起核对：

- **加载反馈：**复用 [components.tsx](../src/components.tsx) 的 `LoadingIndicator`，保持页面与正文按需分包；状态与显示约定见 [笔记加载反馈](DESIGN.md#笔记加载反馈)。
- **引用速览：**[use-note-peek.ts](../src/use-note-peek.ts) 管理悬停、聚焦与关闭延迟，[note-peek.tsx](../src/note-peek.tsx) 按需打开速览，[note-excerpt.ts](../src/note-excerpt.ts) 在标题 slug 生成后提取小节并隔离预览 ID。交互与提取边界见 [笔记引用速览](DESIGN.md#26-笔记引用速览)。
- **代码参考窗：**[code-reference.tsx](../src/code-reference.tsx) 提供固定入口，以笔记路径与代码块序号定位来源；状态在笔记页内跨文章保留。[code-reference-context.ts](../src/code-reference-context.ts) 独立保存共享上下文，确保开发热更新以不同 URL 加载界面模块时仍复用同一入口。[code-reference-window.tsx](../src/code-reference-window.tsx) 与样式按需加载，复用正文高亮与复制；状态、来源、拖动、缩放、收起与窄屏行为见 [代码参考窗](DESIGN.md#27-代码参考窗)。
- **提示块与图组：**语法、容器、图片加载、窄屏和主题传递见 [Markdown 文档排版](DESIGN.md#24-markdown-文档排版)；内容取舍和图示规范按相应学科维护入口读取。

修改共享显示或交互约定时同步设计文档；保留 [Markdown 渲染检查](../scripts/check-markdown-renderer.mjs) 中的引用速览与上下文复用检查。

### 标签页

同一示例有多种实现或运行环境时，可以用标签页并列呈现。把各选项共用的前提放在正文，把专属说明、代码和输出放在对应面板。有先后依赖的步骤按顺序组织。

用 `data-note-tabs` 给整组标签页命名，每个直接子 `div` 用 `data-note-tab` 声明一个标签。组内标签名应简短且唯一，显示顺序随正文。标签与内部 Markdown 内容之间留空行。

```markdown
<div data-note-tabs="查找方式" data-note-tabs-default="二分查找">

<div data-note-tab="线性扫描">

依次检查元素。

</div>

<div data-note-tab="二分查找">

在已排序的序列中逐步缩小查找范围。

</div>

</div>
```

`data-note-tabs-default` 可指定默认项，省略或找不到该项时显示组内首项。各组默认独立选择。需要在同一篇笔记里联动的组使用相同的 `data-note-tabs-sync` 值和一致的默认项，按标签名称匹配。某组缺少所选标签时，该组显示自己的默认项或首项。

正文与速览分别管理选择。搜索和代码参考窗会打开目标所在的面板。视觉与键盘交互见 [Markdown 文档排版](DESIGN.md#24-markdown-文档排版)。

### 参考解答

在对应题目的列表项内，用 `> [!ANSWER]` 引用块编写参考解答。块内可以有段落、列表、公式和代码。公共渲染器在正文和引用速览中生成「参考解答」入口，每题默认收起，可独立展开。配色和动效见 [Markdown 文档排版](DESIGN.md#24-markdown-文档排版)。

```markdown
1. 为什么要用独立的测试样本？

   > [!ANSWER]
   > 在未参与调试的样本上评价，才能估计程序遇到新样本时的表现。
```

## 验证

执行本地验证前遵循 [开发与隔离验证约定](../CONTRIBUTING.md#开发与验证)。

- 修改正文链接或标题后，按相应学科维护规范执行实际渲染锚点检查。
- 修改目录、搜索、加载或渲染逻辑后运行 `pnpm build`，保留 Markdown、清单同步、侧栏、性能预算与私有目录隔离检查。开发中可单独运行有关检查定位问题，完整构建通过后无需重复相同检查。
- 修改规范文档时另外核对自身的相对链接与标题锚点；公开笔记的链接检查不覆盖仓库外层文档或内部规范。

构建检查不执行笔记中的 C++、Python 或训练示例，也不证明外部网址、接口兼容性或实验结论；示例与实验按各学科规范验证，交付时说明实际检查范围。
