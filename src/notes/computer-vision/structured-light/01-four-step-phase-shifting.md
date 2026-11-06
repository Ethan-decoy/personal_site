---
title: 四步相移法
date: 2026-07-04
order: 1
---

# 四步相移法

四步相移法要解决的问题很简单：每个像素的亮度里混着背景、条纹对比度和相位，我们想把前两个不关心的量消掉，只留下相位。

原始模型是：

$$
I = A + B\cos(\varphi + \delta)
$$

其中：

- $\varphi$ 是我们想求的相位。
- $A$ 是背景亮度。
- $B$ 是条纹对比度。
- $\delta$ 是我们主动加进去的相移。

四步相移的设计，是把 $\delta$ 分别设成四个相差 $90^\circ$ 的值：

$$
0,\quad \frac{\pi}{2},\quad \pi,\quad \frac{3\pi}{2}
$$

这样四张图的像素亮度就是：

$$
\begin{aligned}
I_1 &= A + B\cos\varphi \\
I_2 &= A - B\sin\varphi \\
I_3 &= A - B\cos\varphi \\
I_4 &= A + B\sin\varphi
\end{aligned}
$$

先把相隔两步的图相减：

$$
\begin{aligned}
I_4 - I_2 &= 2B\sin\varphi \\
I_1 - I_3 &= 2B\cos\varphi
\end{aligned}
$$

这一步已经把背景亮度 $A$ 消掉了。

再做比值：

$$
\frac{I_4 - I_2}{I_1 - I_3}
=
\frac{2B\sin\varphi}{2B\cos\varphi}
=
\tan\varphi
$$

这一步又把条纹对比度 $B$ 消掉了。

所以最后只需要四张图的亮度值：

$$
\varphi =
\operatorname{atan2}(I_4 - I_2,\ I_1 - I_3)
$$

这个公式好用的地方就在这里：它不需要提前知道背景亮度，也不需要提前知道条纹对比度。四张带相移的图，已经把这两个未知量抵消掉了。
