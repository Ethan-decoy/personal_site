---
title: 数据预处理
date: 2026-11-20
order: 2
---

# 数据预处理

本节用四条房屋记录练习数据预处理。先把原始数据读成表格，再处理缺失值和类别，最后把输入特征与要预测的房价分别转成张量。

## 读取数据集

**CSV（Comma-Separated Values，逗号分隔值）**是一种用纯文本保存表格的文件格式。一条记录里的各个值用逗号隔开，读取时按顺序放到对应的列。

这份房屋数据的第一行 `NumRooms,Alley,Price` 写的是列名，分别表示房间数、巷子类型和房价。后面每行记录一套房屋。比如 `2,NA,106000` 就表示有 2 个房间、巷子类型缺失（`NA`）、房价为 `106000`。

下面先在临时目录中写入 `house_tiny.csv`，再用 `pandas` 的 `pd.read_csv()` 把它读成表格 `data`。退出 `with` 后临时文件会被删除，读入的 `data` 留给后面的代码使用。

运行前先安装 `pandas`。在同一个 Notebook 中按顺序运行代码，到转换张量时再运行所选框架标签里的代码。

```python
from pathlib import Path
from tempfile import TemporaryDirectory

import pandas as pd

csv_text = """NumRooms,Alley,Price
NA,Pave,127500
2,NA,106000
4,NA,178100
NA,NA,140000
"""

with TemporaryDirectory() as temp_dir:
    csv_path = Path(temp_dir) / "house_tiny.csv"
    csv_path.write_text(csv_text, encoding="utf-8")
    data = pd.read_csv(csv_path, encoding="utf-8")

print(data)
```

```text
   NumRooms Alley   Price
0       NaN  Pave  127500
1       2.0   NaN  106000
2       4.0   NaN  178100
3       NaN   NaN  140000
```

房间数为 `2` 的那行里，`Alley` 一列显示 `NaN`。这是 `pandas` 将原文件中的 `NA` 识别为缺失值后的显示结果。

## 处理缺失值

处理缺失数据时，可以根据任务条件填补缺失项、记录缺失状态，或删除含缺失值的行或列。本例保留四个样本。

> [!IMPORTANT] 先分出预测目标，再按特征含义处理缺失
> **预测目标**是需要模型给出的值，**输入特征**是用来预测它的信息。对数值特征，可以用同列已有的数值估计缺失项。对类别特征，可以用指示列保留缺失状态。

### 数值特征的均值填补

按列名取出房价 `Price` 作为预测目标 `outputs`，其余列作为输入特征 `inputs`。房间数 `NumRooms` 是计数，按数值特征处理。两个已知值是 `2` 和 `4`，均值为 `3`。只用这个均值填补房间数缺失的两行。

```python
inputs = data.drop(columns="Price")
outputs = data["Price"]

room_mean = inputs["NumRooms"].mean()
inputs["NumRooms"] = inputs["NumRooms"].fillna(room_mean)
print(inputs)
```

```text
   NumRooms Alley
0       3.0  Pave
1       2.0   NaN
2       4.0   NaN
3       3.0   NaN
```

### 类别特征的独热编码

对巷子类型 `Alley` 使用**独热编码（one-hot encoding）**，给已知类别 `Pave` 建立指示列 `Alley_Pave`。`dummy_na=True` 另外生成 `Alley_nan`，标记原始值缺失的样本。`dtype=int` 让指示值用整数 `0` 和 `1` 表示。

```python
inputs = pd.get_dummies(inputs, columns=["Alley"], dummy_na=True, dtype=int)
print(inputs)
```

```text
   NumRooms  Alley_Pave  Alley_nan
0       3.0           1          0
1       2.0           0          1
2       4.0           0          1
3       3.0           0          1
```

## 转换为张量格式

输入特征和房价现在都可以表示为数值。先用 `to_numpy()` 把它们转成 NumPy 数组，显式指定 `float32`，再交给所选框架构造张量。在这个回归示例中，房价也以浮点数进入后续计算。

```python
X_values = inputs.to_numpy(dtype="float32")
y_values = outputs.to_numpy(dtype="float32")
print(X_values)
print(y_values)
```

```text
[[3. 1. 0.]
 [2. 0. 1.]
 [4. 0. 1.]
 [3. 0. 1.]]
[127500. 106000. 178100. 140000.]
```

<div data-note-tabs="转换为张量" data-note-tabs-default="PyTorch" data-note-tabs-sync="framework">

<div data-note-tab="MXNet">

本标签沿用原书的 MXNet 接口。请在与所用 MXNet 版本兼容的 Python 和 NumPy 环境中运行。

```python
from mxnet import np

X = np.array(X_values)
y = np.array(y_values)
```

</div>

<div data-note-tab="PyTorch">

```python
import torch

X = torch.tensor(X_values)
y = torch.tensor(y_values)
```

</div>

<div data-note-tab="TensorFlow">

```python
import tensorflow as tf

X = tf.constant(X_values)
y = tf.constant(y_values)
```

</div>

<div data-note-tab="Paddle">

```python
import paddle

X = paddle.to_tensor(X_values)
y = paddle.to_tensor(y_values)
```

</div>

</div>

`X` 的形状是 **`(4, 3)`**，每行是一套房屋，每列是一个特征。`y` 的形状是 **`(4,)`**，每项是同一位置的房价。例如，`X[0]` 对应房间数 `3`、巷子类型 `Pave` 的记录，`y[0]` 是这套房的价格 `127500`。可以用 `X.shape` 和 `y.shape` 核对形状，再用[数据操作](01-data-manipulation.md#数据操作)中的方法继续索引或计算。

## 小结

- 从原始表格按字段含义分出输入特征与预测目标，再选择适合的缺失值处理和类别编码方法。
- 把预处理结果转成指定类型的数值数组，再构造张量。输入的样本轴与目标中的顺序一一对应。

## 练习

用 `data` 扩充房价表，至少增加一行和一个数值特征，把新表记为 `larger_data`。保留完整的 `Price` 列，让至少一个特征含缺失值，每个数值特征至少有一个已知值。

1. **删除缺失值最多的特征。** 按列名留出 `Price`，只统计输入特征的缺失值。若有多列并列，删除其中排在最前的一列。

   > [!ANSWER]
   > `isna().sum()` 逐列统计缺失值个数，`idxmax()` 返回第一个达到最大值的列名。
   >
   > ```python
   > exercise_inputs = larger_data.drop(columns="Price")
   > exercise_outputs = larger_data["Price"]
   > most_missing = exercise_inputs.isna().sum().idxmax()
   > exercise_inputs = exercise_inputs.drop(columns=most_missing)
   > ```

1. **转换为张量。** 处理剩余特征中的缺失值和类别，再把特征和房价转成张量。核对每行特征对应的房价及样本数。

   > [!ANSWER]
   > 先选出数值列，分别用本列均值填补。对剩下的类别列做独热编码并保留缺失指示。先核对两张表的行索引，再转成数值数组。
   >
   > ```python
   > numeric = exercise_inputs.select_dtypes(include="number")
   > exercise_inputs[numeric.columns] = numeric.fillna(numeric.mean())
   > exercise_inputs = pd.get_dummies(exercise_inputs, dummy_na=True, dtype=int)
   >
   > assert exercise_inputs.index.equals(exercise_outputs.index)
   > X_values = exercise_inputs.to_numpy(dtype="float32")
   > y_values = exercise_outputs.to_numpy(dtype="float32")
   > ```
   >
   > 重新运行所选框架的转换代码，得到 `X` 和 `y`。此时 `X.shape[0]` 和 `y.shape[0]` 都应等于 `len(larger_data)`。
