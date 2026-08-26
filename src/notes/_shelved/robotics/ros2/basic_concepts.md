---
title: Basic Concepts
date: 2026-05-27
---
# Basic Concepts

## Node

ROS2 中的 <kbd>Node</kbd>（节点），相信学过 C++ 的朋友比较好理解。如果把机器人的整个软件系统看作一个<strong>分布式系统</strong>，那么在代码层面上，每个节点就是一个<strong>类对象实例</strong>。事实也是如此，我们在编写节点时，本质上是自定义一个类，并继承自 `public rclcpp::Node`，从而让这个对象获得与整个 ROS 2 网络通信的能力。

> 节点通常是发布者、订阅者、服务服务器、服务客户端、动作服务器和动作客户端的复杂组合，同时存在于同一节点中。

### discovery

当 <kbd>Node</kbd> 启动时，它会向与其处于同一 ROS 域（由 `ROS_DOMAIN_ID` 环境变量设置）的网络上的其他节点通告其存在。其他节点会以自身的信息响应此通告，以便建立适当的连接并使节点之间能够通信。

节点会周期性地通告其存在，以便在初始发现期之后也能与新发现的实体建立连接。

节点在下线时会向其他节点通告自己。

> 通信规则类似对讲机以及一些行为约束

---

## Interfaces

通常通过三种类型的接口进行通信：<kbd>Topics</kbd> 、<kbd>Services</kbd> 、<kbd>Actions</kbd> 。

ROS 2 使用[接口定义语言（IDL）](./wiki.md#idl)来描述这些接口，便于工具自动为多种语言生成源代码。

>本质是<strong>跨进程/跨语言的数据契约</strong>。解决内存隔离无法传指针的问题，让工具自动生成各语言的‘打包/解包（序列化）’代码，运行时零文件 IO。

| 类型 | 文件后缀 | 说明 |
|------|---------|------|
| msg | `.msg` | 描述 ROS 消息的字段，用于生成各语言的消息源代码 |
| srv | `.srv` | 描述一个服务，由请求（request）和响应（response）两部分组成 |
| action | `.action` | 描述动作，由目标（goal）、结果（result）和反馈（feedback）三部分组成 |

### Server

其实 ROS 2 中的 <kbd>Service</kbd> 类似于经典的 [C/S 架构](./wiki.md#cs-架构)，不过 ROS 2 中的 <kbd>Server</kbd> 不会因为 <strong>Server</strong> 瘫痪而导致全体瘫痪。

在使用时，我们不需要过度聚焦于底层的网络通信细节。ROS 2 已经将底层复杂的 DDS 通信协议进行了完美封装

> 即便底层 DDS 有来自不同厂商的实现版本，如 FastDDS、CycloneDDS 等，我们在应用层也完全不必在乎，只需关注业务逻辑即可。

<br>

### Topic

<kbd>Topic</kbd> 的概念理解比较简单，可以将 <strong>Topic</strong> 理解为一个公告板。相关 <kbd>Node</kbd> 在这里会充当 <strong>Publish/Subscribe（发布/订阅）</strong> 节点，顾名思义，<strong>Publish</strong> 和 <strong>Subscribe</strong> 通过一个目标Topic 来进行信息的发布和获取。

这也就引申出 ROS 2 的一大灵魂———— <strong>Publish/Subscribe System</strong>，我们深入探索一下：

<strong>Publish/Subscribe System</strong>是指存在<strong>数据生成者（Publish）</strong>和<strong>数据消费者（Subscribe）</strong>。<strong>Publish</strong> 和 <strong>Subscribe</strong> 通过 <kbd>Topic</kbd> 这一概念知道如何互相联系，<strong>Topic</strong> 是一个公共名称，使各个实体能够相互找到。

提到 ROS 2 的 <strong>Topic</strong> 就不得不提 ROS 1 的 <strong>Topic</strong>。
- ROS 1 的 <strong>Topic</strong>：底层是 ROS 团队自己手写的基于 <strong>TCP/UDP</strong> 的通信协议。它强依赖一个中心化的 <strong>ROS Master（节点管理器）</strong>。如果 Master 挂了，或者网络波动导致节点断线重连，Topic 通信经常会卡死或失效。
- ROS 2 的 <strong>Topic</strong>：底层换成了工业级的 <strong>DDS（数据分发服务）</strong> 中间件。它是去中心化的，不需要 ROS Master。节点之间通过 <kbd>DDS</kbd> 自动发现，网络断开重连后，Topic 通信能瞬间自动恢复，极其鲁棒。

> 你一定会对 <strong>DDS</strong> 产生疑问，之后会引出

更多的：
- 引入了 <kbd>QoS</kbd> (Quality of Service，服务质量) —— 最大的新特性！

  这是 ROS 2 <strong>Topic</strong> 相比 ROS 1 最直观、最重要的新东西。

  在 ROS 1 中，Topic 发送数据就像发[平信](./wiki.md#平信)，发出去就不管了（尽力而为，<strong>Best Effort</strong>），如果网络拥堵，丢包就丢了。
  <br>但在 ROS 2 中，在创建 <strong>Publisher</strong> 和 <strong>Subscriber</strong> 时，必须为 <kbd>Topic</kbd> 配置 <kbd>QoS</kbd> 策略。

  <strong>ROS 2 QoS</strong> (服务质量) 核心策略
  - <strong>Reliability</strong> (可靠性)：是要求“必须送达（<strong>Reliable</strong>，类似 TCP）”，还是“允许丢包但必须快（<strong>Best Effort</strong>，类似 UDP）”？
  <br>*应用场景：雷达高频扫描数据允许丢包（<strong>Best Effort</strong>），但底盘的急停指令必须绝对送达（<strong>Reliable</strong>）。*
  - <strong>Durability</strong> (持久性)：<strong>Late-joining</strong>（后加入）的 <strong>Subscriber</strong> 能不能收到它启动前发布的历史数据？
  <br>*应用场景：地图数据`/map`，后启动的定位节点必须能通过 <strong>Publisher</strong> 的本地内存缓存，立刻拿到最新的地图`Transient Local`。*
  - <strong>History</strong> (历史记录)：缓存队列里保留几条数据？
  配置方式：通常设置为 `KEEP_LAST` 并指定 `History Depth`（深度，如保留最新的 10 条数据）；或者设置为 `KEEP_ALL`（尽可能保留所有历史数据）。

<strong>零拷贝 (Zero-Copy)</strong> 支持：

在 ROS 1 中，同一个进程里的两个 Node 通过 Topic 传数据，依然要在内存里复制一遍。ROS 2 结合 <kbd>Component Containers（节点容器）</kbd> 和特定的 <kbd>DDS</kbd> 实现，可以实现<strong>同一个进程内</strong>的 Topic 通信“零拷贝”，直接传递内存指针，极大提升了传输效率。

>ROS 2 底层的 <strong>DDS</strong>（比如 FastDDS 或 CycloneDDS）提供了一种高级特性：<strong>共享内存传输（Shared Memory Transport）</strong>
>
>当 <strong>Node A</strong> 和 <strong>Node B</strong> 在同一台物理计算机上运行时，<strong>DDS</strong> 会这样操作：
>- 开辟公共仓库：<strong>DDS</strong> 会在操作系统层面，向系统申请一块<strong>Shared Memory</strong>。
>这块内存不属于进程 1，也不属于进程 2，而是它们俩共同映射到自己地址空间的一块公共区域。
>- <strong>Loaned API</strong>：<strong>Node A</strong> 不自己 `new` 一个 10MB 的对象，而是向 <strong>DDS</strong> 说：”借我一块 10MB 的共享内存 `borrow_loaned_message`”。<strong>Node A</strong> 直接在这个公共区域里填入图像像素。
>- 数据填好后，<strong>Node A</strong> 发布消息。把这块共享内存的地址偏移量（相当于句柄） 通过极小的数据包发送给 Node B。
>- <strong>Node B</strong> 收到数据包后，直接去那块共享内存里读取这 10MB 的图像数据。

通过对于 <kbd>Topic</kbd> 的介绍，可以总结两个特性：
- <strong>强类型</strong>：

  在 ROS 2 中，通信双方传输的数据结构（Message/Service/Action 接口）是被<strong>严格定义</strong>和<strong>强约束</strong>的。

  这不难理解，如果传递的不是一个模板，那双方的发和读都将是不匹配的，如果 <strong>Publisher</strong> 发的是 `sensor_msgs/LaserScan`，而 <strong>Subscriber</strong> 订阅的是 `std_msgs/String` ，ROS 2 会直接拒绝连接，它们根本不会建立通信。

  <strong>强类型</strong>保证了机器人系统中数据流转的绝对安全和可靠。你不可能把电机的控制指令误当成雷达数据发给视觉算法。

- <strong>匿名</strong>

  <kbd>Topic</kbd> 的异步特性很显然，<strong>Publish</strong> 无需关注谁能收到，而 <strong>Subscribe</strong> 也无需关注是谁发布的，只需要`Topic Name`和 <strong>数据格式</strong> 对上就可以。