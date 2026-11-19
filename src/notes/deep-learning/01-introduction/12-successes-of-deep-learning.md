---
title: 深度学习的成功案例
date: 2026-11-13
order: 12
---

# 深度学习的成功案例

邮件分拣是**光学字符识别**（optical character recognition，OCR）的早期应用。美国邮政在 20 世纪 60 年代已用设备识别打印地址，90 年代开始部署手写地址识别。识别出的地址可编码为条码，供分拣设备使用。 [邮政自动化史料](https://postalmuseum.si.edu/the-20th-century-mechanization-and-early-automation) · [手写地址识别项目](https://cedar.buffalo.edu/~srihari/Postal-Research.html)

读取支票金额也是字符识别的应用。研究中常用的 **MNIST 是包含训练集和测试集的手写数字识别基准**，由美国国家标准与技术研究院（NIST）的 SD-1 和 SD-3 手写数字样本整理而来。模型输入一张数字图像，输出 0 到 9 中的一个类别。 [文档识别与 MNIST 论文](https://princetonuniversity.github.io/NEU-PSY-502/_static/pdf/Class%204/LeCunn1998.pdf)

学习系统也常在产品后台工作。例如，Stripe Radar 根据交易信息估计欺诈风险，风险分数可供规则决定是否拦截交易或交给人工复核。这里的学习任务是**估计风险**，分数如何影响支付流程还取决于业务规则。 [交易风险评估说明](https://docs.stripe.com/radar/transaction-risk-prevention)

## 从专用任务到生成与交互

### 语言与代码生成

GPT-3（2020）的实验把任务说明和少量示例放进输入，在模型参数固定时评估翻译、问答等任务。[预训练与后训练](11-development-of-deep-learning.md#预训练后训练与生成式模型)解释了这些输入怎样在模型训练完成后影响当前回答。 [GPT-3 论文](https://arxiv.org/abs/2005.14165v4)

代码生成也有自己的评价方式。Llama 3 报告用 HumanEval 等基准测试函数级代码生成。模型根据题目中的说明生成候选实现，评测用预设测试用例检查它的行为。 [Llama 3 报告的代码评测](https://arxiv.org/html/2407.21783v3#S5.SS2.SSS3)

### 图像生成与多模态

**文本生成图像**以一段描述为条件，输出一张新图像。潜在扩散模型用文字引导去噪过程来完成这项任务。 [潜在扩散论文](https://arxiv.org/abs/2112.10752v2)

Llama 3 报告中的**视觉实验**接收图像或视频，评估视觉问答等任务。报告另有**语音实验**，例如输入一段录音，输出转写文本。读这类实验时，可以先看输入是什么、输出是什么、怎样评价。 [Llama 3 视觉实验](https://arxiv.org/html/2407.21783v3#S7) · [Llama 3 语音实验](https://arxiv.org/html/2407.21783v3#S8)

### 工具交互

在 ReAct 的问答实验中，模型读到问题后可以发出维基百科查询，把返回的信息加入上下文，再继续查询或作答。在这组提示实验中，**回传结果改变了模型可用的上下文，模型参数保持固定**。 [ReAct 问答实验](https://arxiv.org/html/2210.03629v3#S3) · [语言模型与工具调用](09-interaction-and-reinforcement-learning.md#语言模型与工具调用)

### 科学中的结构预测

给定参与复合物的分子，**AlphaFold 3（2024）预测它们在三维空间中的排列**，例如蛋白质与核酸组成的复合物。论文用具有实验结构的样本评估预测结构与实测结构的一致程度，结果对应各自的分子类型和测试条件。 [AlphaFold 3 论文](https://doi.org/10.1038/s41586-024-07487-w)

## 历史基准与现实部署

> [!IMPORTANT] 读懂一个基准成绩
> **一个成绩对应具体任务、测试数据、评价指标和对照基线。** 比较两个结果时，先核对这些条件，也要看系统的版本和测量时间。

### 会话语音识别

语音助手可以先把[语音转成文字](07-sequence-learning.md#语音识别中的不同粒度)，再处理其中的指令。计算**词错误率**（word error rate，WER）时，将输出与参考转写对齐，把最少需要的替换、删除和插入次数相加，再除以参考转写的词数。

微软在 2018 年论文中报告了会话语音系统在 NIST 2000 电话语音测试上的结果。系统在 **Switchboard 上的词错误率是 5.1%**，在 **CallHome 上是 9.8%**。

比较机器和人工的表现，须标明测试子集与转写流程。论文引用的 IBM/Appen 人工转写实验允许多次听取录音并参考对话上下文，在 Switchboard 上也测得 5.1%。 [微软会话语音论文](https://www.microsoft.com/en-us/research/wp-content/uploads/2018/04/ms_swbd17_icassp18.pdf)

### ImageNet 图像分类

ImageNet 大规模视觉识别挑战赛（ILSVRC）的图像分类任务要求系统给一张图片预测类别。**Top-5 错误率**是正确类别没有出现在模型得分最高的五个预测类别中的测试样本比例。它是在测试集上计算的[评价指标](03-objective-functions-and-optimization.md#训练目标与评价指标)。

| 届次 | 获胜方案 | 测试集 Top-5 错误率 |
| --- | --- | ---: |
| 2010 | NEC-UIUC，人工设计的图像特征加支持向量机（SVM） | 约 28.2% |
| 2017 | SENet 模型集成 | 2.251% |

这两项结果记录了图像分类方法的进展。挑战赛的类别集合和测试集在这些年份间有过调整，读表时应把每个分数和对应届次放在一起。 [2010 年竞赛结果](https://www.image-net.org/challenges/LSVRC/2010/results.php) · [主办方基准说明](https://arxiv.org/html/1409.0575) · [SENet 论文](https://arxiv.org/html/1709.01507)

### 游戏中的学习与搜索

从 20 世纪 90 年代到 2010 年代，棋类和扑克一直是研究决策方法的常用场景。这些游戏都明确规定可以采取的行动与获胜条件，可观测的信息各有不同。例如，围棋棋盘对双方可见，扑克对手的底牌是隐藏信息。

- **TD-Gammon 从对弈中学会评估局面。** 它通过自我对弈，用时序差分学习更新神经网络，在西洋双陆棋（backgammon）中改进选择。 [TD-Gammon 论文](https://research.ibm.com/publications/td-gammon-a-self-teaching-backgammon-program-achieves-master-level-play)
- **深蓝依靠专用硬件进行大规模并行搜索。** 它用局面评估和棋局搜索选择国际象棋走法，于 1997 年赢下与卡斯帕罗夫的比赛。 [深蓝论文](https://research.ibm.com/publications/deep-blue)
- **AlphaGo 用神经网络引导树搜索。** 早期版本从人类棋谱和自我对弈中学习，网络为蒙特卡洛树搜索提供走法和局面价值的信息。 [强化学习历史例子](09-interaction-and-reinforcement-learning.md#深度强化学习的历史例子) · [AlphaGo 项目](https://deepmind.google/research/alphago/)
- **Libratus 在隐藏信息下计算策略。** 在双人无限注德州扑克中，它先计算总体策略，再针对对局进展求解局部博弈。 [Libratus 论文](https://www.ijcai.org/proceedings/2017/772)

### 限定条件下的无人驾驶

截至 2026 年 11 月 19 日，Waymo 在官网公布的服务区提供无人驾驶出行。服务区说明乘客可以在哪里叫车，车辆的运行条件还包括适用的道路和天气等。**辅助驾驶由人负责驾驶，限定条件下的无人驾驶由系统在其适用范围内承担驾驶任务。** [Waymo 服务说明](https://waymo.com/faq/) · [驾驶自动化等级](https://www.nhtsa.gov/vehicle-safety/automated-vehicle-safety)

## 能力、可靠性与社会影响

DeepSeek-R1 报告（2025 年发布，2026 年修订）中的 R1-Zero 实验，用强化学习研究可验证任务上的表现。数学题可以通过核对最终答案给出训练反馈，代码题可以通过运行预设测试给出反馈。 [R1-Zero 奖励设计](https://arxiv.org/html/2501.12948v2#S2.SS2)

论文另外跟踪了模型在 **AIME 2024 数学题**上的表现。随着训练进行，按单次作答计的平均答对率（pass@1）从 15.6% 升到 77.9%。这是该数学基准和评分方式下的结果。 [R1-Zero 评测结果](https://arxiv.org/html/2501.12948v2#S2.SS3)

> [!WARNING] 把测试成绩外推到实际使用
> 在工具返回有效资料时测得的问答成绩，只覆盖这一种条件。比如查询当前事实时，工具若返回过期资料，流畅的回答也可能引用已经失效的信息。评价实际可靠性时，需要检查系统遇到这类返回结果时怎样处理。

生成式系统的评估还包括看似可信的错误内容、隐私泄露、偏见和过度依赖。接入工具后，评估对象也包括哪些信息交给工具、工具的结果会怎样影响后续行动。 [NIST 生成式 AI 风险概况](https://doi.org/10.6028/NIST.AI.600-1)

讨论职业影响时，可以分别看**哪些任务能自动完成、系统能否在工作流程中稳定运行、组织是否采用它**。对于通用智能、意识及长期影响，还需要各自的定义、评价依据和不确定性说明。
