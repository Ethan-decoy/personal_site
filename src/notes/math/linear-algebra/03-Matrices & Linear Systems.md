---
title: Matrices & Linear Systems
date: 2026-06-13
---

# 矩阵与线性方程组

## 矩阵  Matrix

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

> 矩阵提供了大规模运算以及发现规律的可能性

---

## 矩阵加法
对应元素相加，要求矩阵大小相同：

$$
\begin{bmatrix} 1 & 2 \cr 3 & 4 \end{bmatrix} + \begin{bmatrix} 5 & 6 \cr 7 & 8 \end{bmatrix} = \begin{bmatrix} 6 & 8 \cr 10 & 12 \end{bmatrix}
$$

---

## 标量乘法
每个元素乘以同一个数：

$$
2 \times \begin{bmatrix} 1 & 2 \cr 3 & 4 \end{bmatrix} = \begin{bmatrix} 2 & 4 \cr 6 & 8 \end{bmatrix}
$$

---

## 矩阵乘法

$A \times B$ 的规则：$A$ 的第 $i$ 行 点乘 $B$ 的第 $j$ 列 = 结果的 $(i,j)$ 位置。

$A$ 的列数 = $B$ 的行数。

### 矩阵 × 向量
$$
A\vec{v} = \begin{bmatrix} a_{11} & a_{12} \cr a_{21} & a_{22} \end{bmatrix} \begin{bmatrix} v_1 \cr v_2 \end{bmatrix}
$$

规则：矩阵每行 点乘 向量

$$
= \begin{bmatrix} a_{11}v_1 + a_{12}v_2 \cr a_{21}v_1 + a_{22}v_2 \end{bmatrix}
$$

具体例子：

$$
\begin{bmatrix} 5 & 6 \cr 7 & 8 \end{bmatrix} \begin{bmatrix} 1 \cr 3 \end{bmatrix} = \begin{bmatrix} 5\times1 + 6\times3 \cr 7\times1 + 8\times3 \end{bmatrix} = \begin{bmatrix} 23 \cr 31 \end{bmatrix}
$$

第 1 行 $[5,6]$ 点乘 $[1,3]^T = 23$
第 2 行 $[7,8]$ 点乘 $[1,3]^T = 31$

### 矩阵 × 矩阵
把矩阵 $B$ 看成一组列向量：

$$
B = \begin{bmatrix} \vec{b_1} & \vec{b_2} \end{bmatrix}
$$

$$
AB = A \begin{bmatrix} \vec{b_1} & \vec{b_2} \end{bmatrix} = \begin{bmatrix} A\vec{b_1} & A\vec{b_2} \end{bmatrix}
$$

$A$ 分别乘以 $B$ 的每一列（每列用矩阵×向量的规则算）。

$$
\begin{bmatrix} 1 & 2 \cr 3 & 4 \end{bmatrix} \begin{bmatrix} 5 & 6 \cr 7 & 8 \end{bmatrix} = \begin{bmatrix} 1\times5+2\times7 & 1\times6+2\times8 \cr 3\times5+4\times7 & 3\times6+4\times8 \end{bmatrix} = \begin{bmatrix} 19 & 22 \cr 43 & 50 \end{bmatrix}
$$

矩阵乘法不满足交换律：$AB \neq BA$（通常情况）。

例外：某些特殊矩阵满足交换律，比如：

- 单位矩阵 $I$：$AI = IA = A$
- 矩阵和它的逆：$AA^{-1} = A^{-1}A = I$
- 两个对角矩阵相乘（通常可交换）

但一般情况下，$AB \neq BA$。

重要推论：

因为 $AB \neq BA$，所以解矩阵方程时不能随便移项：

$$
AX = B \implies X = A^{-1}B \quad \text{（左乘 } A^{-1}\text{）}
$$

$$
XA = B \implies X = BA^{-1} \quad \text{（右乘 } A^{-1}\text{）}
$$

**两边不一样**

---

## 转置 Transpose

操作：**行变列，列变行**。

$$
A = \begin{bmatrix} 1 & 2 & 3 \cr 4 & 5 & 6 \end{bmatrix}
\quad \implies \quad
A^T = \begin{bmatrix} 1 & 4 \cr 2 & 5 \cr 3 & 6 \end{bmatrix}
$$

- $A$ 是 $m \times n$，则 $A^T$ 是 $n \times m$
- 元素关系：$(A^T)_{ij} = A_{ji}$

### 性质

1. $(A^T)^T = A$ — 翻两次回到原样
2. $(A + B)^T = A^T + B^T$ — 转置和加法可交换
3. $(AB)^T = B^T A^T$ — **顺序反转**（维度不匹配时 $A^T B^T$ 根本乘不了）
4. $(kA)^T = k A^T$ — 标量不受影响

### 几何直觉

点积可以写成矩阵乘法形式：

$$
\vec{a} \cdot \vec{b} = \vec{a}^T \vec{b}
$$

把一个向量变成行，另一个是列，矩阵乘法结果就是一个数。

### $A^T A$ 的特殊性质

$A^T A$ **总是对称矩阵**（$(A^T A)^T = A^T A$）。

即使 $A$ 不是方阵，$A^T A$ 也是方阵，这在最小二乘法中非常关键。


