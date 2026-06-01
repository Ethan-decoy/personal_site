---
title: Basic Concepts
date: 2026-05-27
---
# Basic Concepts

## Node

ROS2 中的 <kbd>Node</kbd>（节点），相信学过 C++ 的朋友比较好理解。如果把机器人的整个软件系统看作一个**分布式系统**，那么在代码层面上，每个节点就是一个**类对象实例**。事实也是如此，我们在编写节点时，本质上是自定义一个类，并继承自 `public rclcpp::Node`，从而让这个对象获得与整个 ROS 2 网络通信的能力。

> 节点通常是发布者、订阅者、服务服务器、服务客户端、动作服务器和动作客户端的复杂组合，同时存在于同一节点中。

---

## Interfaces

通常通过三种类型的接口进行通信：<kbd>Topics</kbd>、<kbd>Services</kbd>、<kbd>Actions</kbd>。

ROS 2 使用[接口定义语言（IDL）](./wiki.md#idl)来描述这些接口，便于工具自动为多种语言生成源代码。

| 类型 | 文件后缀 | 说明 |
|------|---------|------|
| msg | `.msg` | 描述 ROS 消息的字段，用于生成各语言的消息源代码 |
| srv | `.srv` | 描述一个服务，由请求（request）和响应（response）两部分组成 |
| action | `.action` | 描述动作，由目标（goal）、结果（result）和反馈（feedback）三部分组成 |

### Server

其实 ROS 2 中的 <kbd>Service</kbd> 类似于经典的 [C/S 架构](./wiki.md#cs-架构)，不过 ROS 2 中的 <kbd>Server</kbd> 不会因为 **Server** 瘫痪而导致全体瘫痪。

在使用时，我们不需要过度聚焦于底层的网络通信细节。ROS 2 已经将底层复杂的 DDS 通信协议进行了完美封装

> 即便底层 DDS 有来自不同厂商的实现版本，如 FastDDS、CycloneDDS 等，我们在应用层也完全不必在乎，只需关注业务逻辑即可。

---
