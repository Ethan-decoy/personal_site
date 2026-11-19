---
title: 深度学习的发展
date: 2026-11-13
order: 11
---

# 深度学习的发展

## 数据、内存与算力

2010 年前后，互联网服务和传感器带来了更多样本，存储成本下降让保存和使用大规模数据更可行，GPU 则加速了神经网络中常见的矩阵运算。已有的模型和训练方法因此能用在更大的任务上。2012 年的 AlexNet 研究就用逾百万张带标签的图像训练卷积网络，识别 ImageNet 挑战赛中的 1000 个类别。 [AlexNet 论文](https://papers.neurips.cc/paper_files/paper/2012/hash/c399862d3b9d6b76c8436e924a68c45b-Abstract.html)

- **训练集大小衡量有多少样本可供训练。** 对图像分类，可用训练图像张数描述规模，样本是否覆盖目标场景则要看[数据的代表性](02-data-and-models.md#数据是否适合当前任务)。
- **显存限制一步训练能同时容纳的模型和批量。** 模型参数、前向计算的中间结果、梯度和优化器状态都会占用显存，数据可以分批读入。
- **计算吞吐量影响单位时间能完成多少计算。** 设备规格给出特定运算的峰值，实际训练速度还受数值精度、数据读取和设备间通信影响。

[表1.5.1](#tab-intro-decade)用两款历史设备说明怎样读规格。FLOPS 表示每秒浮点运算次数，TFLOPS 和 PFLOPS 分别对应每秒 $10^{12}$ 和 $10^{15}$ 次浮点运算。

<p id="tab-intro-decade" style="scroll-margin-top: 6rem;">表1.5.1 两种设备的内存与峰值算力</p>

| 设备（规格年份） | 内存规格 | 算力峰值 |
| --- | --- | --- |
| [Tesla C2050](https://www.nvidia.com/docs/IO/43395/NV_DS_Tesla_C2050_C2070_jul10_lores.pdf)（2010） | 单卡显存 3 GB | FP32 单卡 1.03 TFLOPS |
| [DGX-2](https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/dgx-2/dgx-2-print-datasheet-738070-nvidia-a4-web-uk.pdf)（2018） | 主机内存 1.5 TB，16 卡总显存 512 GB | 整机张量运算 2 PFLOPS |

C2050 与 DGX-2 的峰值对应**不同的设备范围和运算类型**。比较训练速度时，应固定任务、精度和计时范围，再看达到给定结果需要多长时间。

这些条件让[前一节介绍的多层网络](10-origins-of-machine-learning.md#多层模型梯度与更新)在更大的规模上派上用场。1943 年的阈值神经元工作描述了输入怎样触发响应。1998 年的文档识别和 2005 年的音素分类展示了卷积网络与双向长短期记忆网络（LSTM）的应用。1992 年论文中的 Q 学习也在后来与深度网络结合。 [阈值神经元](https://doi.org/10.1007/BF02478259) · [文档识别](https://bottou.org/papers/lecun-98h) · [双向 LSTM](https://www.sciencedirect.com/science/article/pii/S0893608005001206) · [Q 学习](https://www.gatsby.ucl.ac.uk/~dayan/papers/wd92.html)

## 模型与训练方法的进展

### 随机屏蔽与过拟合

**Dropout 在训练时随机将部分单元的输出置零。** 每次前向计算用到的单元组合可能不同，这能减弱单元之间对特定组合的依赖，有助于缓解过拟合。使用训练好的模型预测时，通常关闭随机屏蔽。 [Dropout 论文](https://www.jmlr.org/papers/v15/srivastava14a.html)

### 注意力与多步读取

在早期的编码器—解码器翻译模型中，解码器可以依靠一个固定长度的向量接收原句信息。原句很长时，把所有需要的信息压进这个向量会成为瓶颈。

**注意力（attention）让解码器在生成每个目标词时重新读取源句表示。** 可训练的打分网络根据当前解码状态给源句各位置打分，再用归一化后的权重对对应的编码表示加权求和。Bahdanau 等人在英译法实验中观察到，这种方法改善了长句上的翻译表现。 [翻译中的对齐与注意力](https://arxiv.org/html/1409.0473v7#S3.SS1)

同一模型也可以安排多个读取或执行步骤。**端到端记忆网络**把读出的内容并入查询，再用更新后的查询读取记忆。**神经程序解释器**在冒泡排序的示例中，根据当前程序和观察到的状态决定接下来调用哪个操作，例如比较、交换或移动指针。 [记忆网络论文](https://arxiv.org/abs/1503.08895) · [神经程序解释器论文](https://arxiv.org/html/1511.06279#S3)

### 生成样本与判别来源

**生成对抗网络（generative adversarial network，GAN）用判别反馈训练生成器。** 生成器把随机输入映射为样本，判别器学习区分真实样本与生成样本。训练更新的是网络的参数，训练后的生成器可以通过抽取新的随机输入来生成样本。 [GAN 论文](https://arxiv.org/abs/1406.2661)

后续的应用使用了不同的输入条件。CycleGAN 在未配对的照片中学习马与斑马之间的图像转换，Progressive GAN 能从随机输入合成新的人脸图像，SPADE 则根据标有类别的区域布局合成场景。 [CycleGAN](https://junyanz.github.io/CycleGAN/) · [Progressive GAN](https://arxiv.org/abs/1710.10196) · [SPADE](https://nvlabs.github.io/SPADE/)

### 分布式训练与全局批量

在一种常见的**同步数据并行**训练中，每张 GPU 上有一份模型副本，各卡处理不同的数据并计算梯度，汇总梯度后再更新参数。每卡批量影响显存占用和计算利用率，全局批量则决定一次梯度估计用了多少样本。

如果每卡处理一个小批量就同步更新一次，1024 张 GPU 各处理 32 张图像，这一次更新的全局批量大小是

$$
1024 \times 32 = 32\,768 \text{ 张图像}.
$$

实际训练还需要协调显存、梯度通信和优化设置。增大全局批量会改变每轮的更新次数，因此要同时观察训练速度和模型表现。 [同步数据并行说明](https://docs.pytorch.org/tutorials/beginner/ddp_series_theory.html)

Jia 等人在 2018 年的实验中，用 **2048 张 Tesla P40、全局批量 64K 和混合精度**在 ImageNet 上训练 ResNet-50。论文报告训练 90 轮用时 6.6 分钟，Top-1 准确率为 75.8%。这些数字对应当时报告的这一组配置。 [训练实验 §5.2](https://arxiv.org/html/1807.11205v1#S5.SS2)

### 并行采集与强化学习

并行运行多个环境实例可以更快收集经验。每条经验包含动作、奖励和后续观测等信息，连续的交互还可以用来判断早期动作对后续回报的影响。 [观测、动作与奖励](09-interaction-and-reinforcement-learning.md#观测动作与奖励)

围棋中的 AlphaGo 结合了人类棋谱、自我对弈和搜索，DQN 则在雅达里游戏中评估智能体的表现。后来，AlphaStar 在论文的《星际争霸 II》在线评测中达到了宗师级。每个结果都要结合相应的任务、规则和比较基线阅读。 [深度强化学习的历史例子](09-interaction-and-reinforcement-learning.md#深度强化学习的历史例子) · [AlphaStar 评测](https://deepmind.google/blog/alphastar-grandmaster-level-in-starcraft-ii-using-multi-agent-reinforcement-learning/)

在物理任务中，MuJoCo 等仿真引擎可以提供可重复的交互环境。经验对学习的价值取决于奖励设计、采集覆盖和仿真条件与目标任务的匹配程度。 [MuJoCo 文档](https://mujoco.readthedocs.io/en/stable/overview.html#introduction)

## 预训练、后训练与生成式模型

### 语言模型的训练与使用

2017 年的 Transformer 以注意力机制组织序列计算，为此后的许多语言模型提供了架构基础。GPT-3 在 2020 年的实验中把任务说明和少量示例放进输入，研究了同一模型在参数固定时怎样应对不同任务。 [Transformer 论文](https://arxiv.org/abs/1706.03762) · [GPT-3 论文](https://arxiv.org/abs/2005.14165)

> [!IMPORTANT] 训练更新参数，推理使用上下文
> **预训练和后训练都利用学习信号更新模型参数，监督微调属于后训练。** 使用已训练的模型推理时，提示、示例和工具返回的结果提供上下文，模型用固定的参数生成当前输出。

以自回归语言模型为例，监督示范、偏好反馈和可验证结果都可以用于适配模型，具体怎样组合取决于训练目标。

| 环节 | 数据或反馈 | 发生的变化 |
| --- | --- | --- |
| [自监督预训练](08-unsupervised-learning.md#从数据自身构造学习信号) | 文本中的下一个词元 | 训练模型预测词元 |
| 监督微调（后训练） | 指令与示范回答 | 更新参数，适配任务或回答方式 |
| 基于反馈的后训练 | 人工偏好或可核对的结果 | 按反馈构造训练信号并更新参数 |
| 使用时的[推理与工具调用](09-interaction-and-reinforcement-learning.md#语言模型与工具调用) | 当前问题、历史消息及工具结果 | 使用上下文生成输出，参数保持固定 |

**InstructGPT（2022）**先用示范回答进行监督微调，再用人类对回答的排序训练奖励模型，最后用强化学习提高模型得到的奖励。**DeepSeek-R1（2025，报告于 2026 年修订）**中的 R1-Zero 实验则使用可核对的答案和代码测试结果构造正确性奖励，考察若干推理任务上的表现。 [InstructGPT 论文](https://arxiv.org/abs/2203.02155) · [DeepSeek-R1 报告 §2.2](https://arxiv.org/html/2501.12948v2#S2.SS2)

### 图像生成与多模态

**潜在扩散模型在编码后的潜空间中学习去噪。** 生成时，模型从噪声开始逐步去噪，再将得到的潜表示解码为图像。文本等条件可以用来引导这个过程。 [潜在扩散论文](https://arxiv.org/abs/2112.10752v2)

多模态研究让模型处理不同类型的信息。例如，Llama 3 报告分别记录了视觉任务与语音任务的实验。阅读结果时，应看具体模型接收什么输入、产生什么输出，以及使用了什么任务来评价。 [视觉实验](https://arxiv.org/html/2407.21783v3#S7) · [语音实验](https://arxiv.org/html/2407.21783v3#S8)

## 框架与学习工具

深度学习框架封装张量运算、自动微分和硬件执行等常用功能。Caffe、Torch、Theano 和 Chainer 在早期研究中发挥过作用。Apache MXNet 已退休，项目资料归入 Apache Attic。 [Apache MXNet 项目状态](https://attic.apache.org/projects/mxnet.html)

可从 [PyTorch 基础教程](https://docs.pytorch.org/tutorials/beginner/basics/intro.html) 开始动手，练习如何准备张量、定义模型和用梯度更新参数。JAX 提供可组合的自动微分、编译和向量化变换，Keras 3 则支持在 JAX、TensorFlow 和 PyTorch 等后端上组织工作流。选择框架时，可以依据现有代码、硬件和部署需求。 [PyTorch 文档](https://docs.pytorch.org/docs/stable/index.html) · [JAX 文档](https://docs.jax.dev/en/latest/notebooks/thinking_in_jax.html) · [Keras 3 文档](https://keras.io/keras_3/)

框架减少了重复实现。**模型能否推广到新数据**，仍要结合训练目标、数据划分和实际评估结果来判断。 [训练表现与新数据表现](03-objective-functions-and-optimization.md#训练表现与新数据表现)
