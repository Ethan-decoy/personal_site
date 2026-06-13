---
title: temp
date: 2026-05-30
---

第一点：对，矩阵最基础的理解就是"规则排列的有序数字"。但它不只是存数据，还有运算规则（矩阵乘法、转置等），这些运算赋予了它意义。

第二点：我说的"$n$ 维向量"不是基向量，是任意向量。

比如 $\mathbb{R}^3$ 中的任意向量：
$$
\begin{bmatrix} x \cr y \cr z \end{bmatrix}
$$

这里的 $x, y, z$ 是具体的数值（比如 $[1, 2, 3]$），不是基向量。

基向量是特殊的向量：
$$
\vec{e_1} = \begin{bmatrix} 1 \cr 0 \cr 0 \end{bmatrix}, \quad \vec{e_2} = \begin{bmatrix} 0 \cr 1 \cr 0 \end{bmatrix}, \quad \vec{e_3} = \begin{bmatrix} 0 \cr 0 \cr 1 \end{bmatrix}
$$

任意向量可以用基向量表示：
$$
\begin{bmatrix} 1 \cr 2 \cr 3 \end{bmatrix} = 1\vec{e_1} + 2\vec{e_2} + 3\vec{e_3}
$$

所以矩阵的作用是：

输入：任意一个 $n$ 维向量（比如 $[x, y, z]$）
输出：变换后的 $m$ 维向量



---

Phase 2, Topic 1: 矩阵是什么 (What is a Matrix)
类型: Conceptual

矩阵是一个长方形排列的数字表格：

$$
A = \begin{bmatrix} 1 & 2 & 3 \cr 4 & 5 & 6 \end{bmatrix}
$$

这是一个 $2 \times 3$ 矩阵（2 行 3 列）。

三种视角：

1. 数据表格
每行是一条记录，每列是一个特征。

2. 线性变换
矩阵把 $n$ 维向量变成 $m$ 维向量。比如上面的 $2 \times 3$ 矩阵把 $\mathbb{R}^3$ 中的向量变成 $\mathbb{R}^2$ 中的向量。

$$
\begin{bmatrix} 1 & 2 & 3 \cr 4 & 5 & 6 \end{bmatrix} \begin{bmatrix} x \cr y \cr z \end{bmatrix} = \begin{bmatrix} x + 2y + 3z \cr 4x + 5y + 6z \end{bmatrix}
$$

3. 线性方程组的系数

$$
\begin{cases} x + 2y + 3z = 7 \cr 4x + 5y + 6z = 8 \end{cases}
$$

系数矩阵：
$$
\begin{bmatrix} 1 & 2 & 3 \cr 4 & 5 & 6 \end{bmatrix}, \quad \text{右边} \begin{bmatrix} 7 \cr 8 \end{bmatrix}
$$

线性变换视角最重要。矩阵对空间做变换：拉伸、旋转、投影。

清楚吗？
