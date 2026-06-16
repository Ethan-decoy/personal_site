---
title: Matrices & Linear Systems
date: 2026-06-13
---

# 矩阵与线性方程组

## 矩阵  Matrix

> 矩阵代表一个特定的线性变换

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

> 进行线性变换后的目标向量

$$
A\vec{v} = \begin{bmatrix} a & b \cr c & d \end{bmatrix} \begin{bmatrix} x \cr y \end{bmatrix}
$$

规则：矩阵每行 点乘 向量

$$
= \begin{bmatrix} ax + by \cr cx + dy \end{bmatrix}
$$

具体例子：

$$
\begin{bmatrix} 5 & 6 \cr 7 & 8 \end{bmatrix} \begin{bmatrix} 1 \cr 3 \end{bmatrix} = \begin{bmatrix} 5\times1 + 6\times3 \cr 7\times1 + 8\times3 \end{bmatrix} = \begin{bmatrix} 23 \cr 31 \end{bmatrix}
$$

第 1 行 $[5,6]$ 点乘 $[1,3]^T = 23$
第 2 行 $[7,8]$ 点乘 $[1,3]^T = 31$

### 矩阵 × 矩阵

> 两个线性变换相继作用

把矩阵 $B$ 看成一组列向量：

$A$ 分别乘以 $B$ 的每一列（每列用矩阵×向量的规则算）。

$$
\begin{bmatrix} a & b \cr c & d \end{bmatrix} \begin{bmatrix} e & f \cr g & h \end{bmatrix} = \begin{bmatrix} a & b \cr c & d \end{bmatrix} \begin{bmatrix} e \cr g \end{bmatrix} + \begin{bmatrix} a & b \cr c & d \end{bmatrix} \begin{bmatrix} f \cr h \end{bmatrix}= \begin{bmatrix} ae+bg & af+bh \cr ce+dg & cf+dh \end{bmatrix}
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

---

## 高斯消元法  Gaussian Elimination

> 通过一系列合法的变形，把一个复杂的方程组，变成一个阶梯状（上三角）的形式。

在这个形式下，最后一个方程只有一个未知数，倒数第二个方程有两个未知数……以此类推。只需要**从下往上倒着算（回代）**，就能轻松求出所有答案。

### 实例

$$
\begin{cases}
x + y + z = 6 & \text{(方程1)} \\
2x - y + z = 3 & \text{(方程2)} \\
x + 2y - z = 2 & \text{(方程3)}
\end{cases}
$$

#### 增广矩阵

$$
\left[\begin{array}{ccc|c}
1 & 1 & 1 & 6 \\
2 & -1 & 1 & 3 \\
1 & 2 & -1 & 2
\end{array}\right]
$$

#### 前向消元（化成上三角矩阵）

**目标 A：消灭第一列下方的数字（把第2行和第3行的第一个数字变成0）**
*   **看第1列**，第一行的 `1` 就是**主元**。
*   **消灭第2行的 `2`**：用第2行减去第1行的2倍。
    记作：$R_2 - 2R_1 \to R_2$
*   **消灭第3行的 `1`**：用第3行减去第1行的1倍。
    记作：$R_3 - R_1 \to R_3$

现在的矩阵:

$$
\left[\begin{array}{ccc|c}
\mathbf{1} & 1 & 1 & 6 \\
\mathbf{0} & -3 & -1 & -9 \\
\mathbf{0} & 1 & -2 & -4
\end{array}\right]
$$

**目标 B：消灭第二列下方的数字（把第3行的第二个数字变成0）**
*   **看第2列**，此时第二行的主元是 `-3`，第三行是 `1`。
*   为了消灭第3行的 `1`，我们可以用第3行加上第2行的 $\frac{1}{3}$ 倍。但是分数太麻烦了！
*   **小技巧**：我们可以把第2行和第3行**交换位置**（合法操作！），这样主元就变成了 `1`，算起来超级简单。
    记作：$R_2 \leftrightarrow R_3$
$$
\left[\begin{array}{ccc|c}
1 & 1 & 1 & 6 \\
0 & \mathbf{1} & -2 & -4 \\
0 & \mathbf{-3} & -1 & -9
\end{array}\right]
$$
*   **现在消灭第3行的 `-3`**：用第3行加上第2行的3倍。
    记作：$R_3 + 3R_2 \to R_3$

现在的矩阵变成了**阶梯形矩阵**：
$$
\left[\begin{array}{ccc|c}
\mathbf{1} & 1 & 1 & 6 \\
0 & \mathbf{1} & -2 & -4 \\
0 & 0 & \mathbf{-7} & -21
\end{array}\right]
$$

#### 步骤 3：回代求解（从下往上算）

现在把矩阵还原成方程组：
1) $x + y + z = 6$
2) $y - 2z = -4$
3) $-7z = -21$

*   **从第3个方程开始**：$-7z = -21 \Rightarrow \mathbf{z = 3}$
*   **代入第2个方程**：$y - 2(3) = -4 \Rightarrow y - 6 = -4 \Rightarrow \mathbf{y = 2}$
*   **代入第1个方程**：$x + 2 + 3 = 6 \Rightarrow x + 5 = 6 \Rightarrow \mathbf{x = 1}$

**最终答案**：$x=1, y=2, z=3$。

#### 特殊情况

在实际做题或编程时，可能会遇到以下两种“异常”情况：

1. **主元是 0 怎么办？**
   如果在消元时，你发现当前主对角线上的数字是 0（没办法做除法或乘法消元），**直接把它下面某一行非零的数字换上来**（交换两行）即可。
2. **出现 `0 = 非零数`（例如 $0x + 0y + 0z = 5$）**
   这说明方程组**相互矛盾，无解**。在矩阵里表现为一行左边全是0，右边不是0。
3. **出现 `0 = 0`（例如 $0x + 0y + 0z = 0$）**
   这说明有方程是多余的。方程组有**无穷多解**，你需要引入“自由变量”（比如令 $z = t$），然后用 $t$ 来表示 $x$ 和 $y$。

---

## 逆矩阵  Matrix Inverse

先看一个简单例子。我们知道 $3 \times \frac{1}{3} = 1$，$\frac{1}{3}$ 是 $3$ 的"撤销"操作 — 乘以 3 再乘以 $\frac{1}{3}$，回到原点。

矩阵也有类似的"撤销"操作。如果 $A$ 是一个矩阵，它的逆矩阵 $A^{-1}$ 满足：

$$
A A^{-1} = A^{-1} A = I
$$

其中 $I$ 是单位矩阵（对角线为 1，其余为 0）。

直觉： 把矩阵 $A$ 看作一个"变换"（旋转、拉伸等），$A^{-1}$ 就是把这个变换完全还原回去的操作。比如 $A$ 把东西旋转 30°，那 $A^{-1}$ 就是旋转 -30°。

举个具体例子：

$$
A = \left(\begin{array}{cc} 2 & 0 \cr 0 & 3 \end{array}\right)
$$

这个矩阵做了什么变换？它把 x 方向拉伸 2 倍，y 方向拉伸 3 倍。

它的逆矩阵 $A^{-1}$ 应该做什么？你能猜出来吗？

答案是：x 方向压缩 $\frac{1}{2}$ 倍，y 方向压缩 $\frac{1}{3}$ 倍。

$$
A^{-1} = \left(\begin{array}{cc} \frac{1}{2} & 0 \cr 0 & \frac{1}{3} \end{array}\right)
$$

### 什么时候矩阵不可逆？

不是所有矩阵都有逆矩阵。以下三种情况**没有逆**：

#### **几何视角：空间被"压扁"到低维**

如果矩阵把空间压缩到更低的维度，这个变换就**无法还原**。

- 把 2D 平面投影成一条线 → 无法知道原来的点在哪儿
- 把 3D 空间压成平面或直线 → 同样的，信息丢失了

$$
\text{投影矩阵} = \begin{bmatrix} 1 & 0 \cr 0 & 0 \end{bmatrix}
$$

它把 y 坐标全部变成 0（压成 x 轴）。原来的 y 是多少？**信息丢了**，所以没有逆。

#### **代数视角：行列式 = 0**

$$
\det(A) = 0 \iff A \text{ 不可逆}
$$

对于 $2 \times 2$ 矩阵：
$$
\begin{bmatrix} a & b \cr c & d \end{bmatrix},\quad \det = ad - bc
$$

例子：
$$
\begin{bmatrix} 2 & 4 \cr 1 & 2 \end{bmatrix},\quad \det = 2\times2 - 4\times1 = 0
$$

行列式为 0，不可逆。

#### **线性代数视角：列向量线性相关**

如果矩阵的列向量（或行向量）之间存在线性关系，说明它们"冗余"了，矩阵不满秩，不可逆。

$$
\begin{bmatrix} 2 & 4 \cr 1 & 2 \end{bmatrix}
$$

第 2 列 = 第 1 列 × 2，完全冗余 → 不可逆。

### 可逆 vs 不可逆

| | 可逆 | 不可逆 |
|---|---|---|
| 几何 | 空间维度不变（旋转、拉伸） | 空间被压缩（投影、坍缩） |
| 行列式 | $\det \neq 0$ | $\det = 0$ |
| 列向量 | 线性无关 | 线性相关 |
| 秩 | 满秩 | 不满秩 |

---

## 行列式  Determinant
### 2×2

$$
\det\left(\begin{array}{cc} a & b \cr c & d \end{array}\right) = ad - bc
$$

### 3×3

$$
\det\left(\begin{array}{ccc} a & b & c \cr d & e & f \cr g & h & i \end{array}\right)

= a \cdot \det\left(\begin{array}{cc} e & f \cr h & i \end{array}\right) - b \cdot \det\left(\begin{array}{cc} d & f \cr g & i \end{array}\right) + c \cdot \det\left(\begin{array}{cc} d & e \cr g & h \end{array}\right)
$$

*规律：大行列式 → 拆成小行列式。正负交替：$+, -, +, -, ...$*

### 几何意义

- 绝对值 — 缩放倍数（面积/体积放大了多少）

- 符号 — 方向是否翻转
  - $\det > 0$ — 方向不变
  - $\det < 0$ — 方向反了
  - $\det = 0$ — 空间被压扁，维度降低

#### **单位矩阵**

$$
\det(I) = 1
$$

#### **矩阵正逆关系**

为倒数关系：

由 $\det(A A^{-1}) = \det(I) = 1$，以及 $\det(AB) = \det(A) \cdot \det(B)$，得到：

$$
\det(A) \cdot \det(A^{-1}) = 1 \implies \det(A^{-1}) = \frac{1}{\det(A)}
$$

---

## LU分解  LU Decomposition

假设要解一个 $3 \times 3$ 的线性方程组 $Ax = b$。

已知：
$$
A = \begin{pmatrix} 2 & 1 & 1 \\ 4 & -6 & 0 \\ -2 & 7 & 2 \end{pmatrix}
\quad \quad
b = \begin{pmatrix} 7 \\ -8 \\ 18 \end{pmatrix}
$$

我们的目标是求出向量 $x = \begin{pmatrix} x_1 \\ x_2 \\ x_3 \end{pmatrix}$。

整个过程分为两大阶段：**第一阶段做 LU 分解（只针对 A）**，**第二阶段求解 x（结合 b）**。

### LU 分解

> 把矩阵 $A$ 通过高斯消元法变成上三角矩阵 $U$，并把消元过程中用到的**乘数**记录下来，组装成下三角矩阵 $L$。

#### 构造 U
我们观察矩阵 $A$ 的第一列。第一行的主元是 $2$。

1.  **消去第二行的 4**：
2.  **消去第三行的 -2**：

此时，矩阵变成了：
$$
\begin{pmatrix} 
2 & 1 & 1 \\ 
0 & -8 & -2 \\ 
0 & 8 & 3 
\end{pmatrix}
$$

现在我们看第二列。此时第二行的主元变成了 **$-8$**。我们只需要消去第三行下方的 $8$。

至此，消元结束。我们得到了最终的**上三角矩阵 $U$**：
$$
U = \begin{pmatrix} 
2 & 1 & 1 \\ 
0 & -8 & -2 \\ 
0 & 0 & 1 
\end{pmatrix}
$$

#### 构造 L
现在，我们拿出一个 $3 \times 3$ 的空白矩阵。
*   把**主对角线**上的元素全填为 **$1$**。
*   把**主对角线上方**的元素全填为 **$0$**。
*   把我们刚才算出来的**乘数**，填入对应的左下角位置。

*   $l_{21} = 2$ 填在第二行第一列。
*   $l_{31} = -1$ 填在第三行第一列。
*   $l_{32} = -1$ 填在第三行第二列。

得到完整的**下三角矩阵 $L$**：
$$
L = \begin{pmatrix} 
1 & 0 & 0 \\ 
2 & 1 & 0 \\ 
-1 & -1 & 1 
\end{pmatrix}
$$

**公式：$A = LU$**

### 利用 L 和 U 求解方程组
现在，我们要解方程 $Ax = b$。因为 $A = LU$，所以方程变成了 $LUx = b$。
我们引入一个中间向量 $y = \begin{pmatrix} y_1 \\ y_2 \\ y_3 \end{pmatrix}$，将计算分为两步：
1.  先解 **$Ly = b$**
2.  再解 **$Ux = y$**

#### 解 $Ly = b$ (前向代入法)
写出方程 $Ly = b$：
$$
\begin{pmatrix} 
1 & 0 & 0 \\ 
2 & 1 & 0 \\ 
-1 & -1 & 1 
\end{pmatrix} 
\begin{pmatrix} 
y_1 \\ 
y_2 \\ 
y_3 
\end{pmatrix} 
= 
\begin{pmatrix} 
7 \\ 
-8 \\ 
18 
\end{pmatrix}
$$

把它展开成三个代数方程，**从上往下**顺序求解：
1.  第一行：$1 \cdot y_1 = 7$ 
    $\Rightarrow$ 直接得出 **$y_1 = 7$**
2.  第二行：$2 \cdot y_1 + 1 \cdot y_2 = -8$
    $\Rightarrow$ 算出 **$y_2 = -22$**
3.  第三行：$-1 \cdot y_1 - 1 \cdot y_2 + 1 \cdot y_3 = 18$
    $\Rightarrow$ 算出 **$y_3 = 3$**

现在，我们求出了中间向量 **$y = \begin{pmatrix} 7 \\ -22 \\ 3 \end{pmatrix}$**。

#### 解 $Ux = y$ (回代法)
最后一步，写出方程 $Ux = y$：
$$
\begin{pmatrix} 
2 & 1 & 1 \\ 
0 & -8 & -2 \\ 
0 & 0 & 1 
\end{pmatrix} 
\begin{pmatrix} 
x_1 \\ 
x_2 \\ 
x_3 
\end{pmatrix} 
= 
\begin{pmatrix} 
7 \\ 
-22 \\ 
3 
\end{pmatrix}
$$

把它展开成三个代数方程，**从下往上**倒序求解：
1.  第三行：$1 \cdot x_3 = 3$
2.  第二行：$-8 \cdot x_2 - 2 \cdot x_3 = -22$
3.  第一行：$2 \cdot x_1 + 1 \cdot x_2 + 1 \cdot x_3 = 7$

得出方程组的最终解：
$$
x = \begin{pmatrix} 1 \\ 2 \\ 3 \end{pmatrix}
$$
