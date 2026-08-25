# AGENTS.md

本仓库用于以树外插件扩展 `deepseek-harness`，产品方向是 AI roleplay。业务功能默认只在 `plugins/` 中实现，不把 Harness 源码或本机联调环境纳入仓库。

产品协议与插件关系见 `docs/rp-architecture.md`。

## 会话数据架构

Roleplay 采用 **Session-centric、event-sourced、live-source-referenced** 架构。Harness Session 是一次 RP 会话的一等公民和聚合根；不得在 Agent、插件 service、Web 客户端或独立消息仓库中建立与 Session 并列的会话事实源。

- Harness `SessionEvent` Log 是会话内容和持久业务变化的唯一权威事实源。用户与模型消息、turn/step/tool 生命周期、Session profile 变更以及最终 RP 提交都必须记录为可回放的 Harness 原生事件。
- 当前会话的 Agent preset 身份和 RP profile 以 Session 为作用域。profile 持有参与模式、控制权、cast、场景、运行偏好以及当前资产绑定；reload、replay 和 fork 必须只依赖 Session Log 恢复相同行为。
- 角色卡、世界书、用户人设、创作预设和文风等可复用资产实体属于独立、可变的共享事实源。Session 保存资产 `id` 引用；`revision` 和 `hash` 只用于 CAS、缓存失效、诊断与本轮一致性检查，不把 Session 固定到历史资产版本。事实源更新后，所有引用它的 Session 在下一次上下文组装时读取更新后的内容；已经写入历史楼层的模型上下文 snapshot 保持不变。文风以有序 `id` 列表绑定，所选内容聚合为可在 Chat Prompt 布局中移动的上下文来源。
- Host 浏览器资产 service 与 preset 运行时资产 service 可以是同一共享目录上的不同实例，但同一进程内的资产 mutation 必须按规范化目录串行化，确保重复检测和 revision-CAS 跨实例仍然原子；实例内缓存不得成为第二事实源。
- `rp/session` 和 `rp/state` 是按 Session Event Log 分键折叠得到的投影，不是第二份事实源。投影必须可丢弃并从日志完整重建；失败或未提交的命令、turn 和工具结果不得改变业务投影。
- 用户消息和助手回复都是独立的 RP 消息操作单元。`rp-core` 统一定义版本化的 `rpMessageAction` metadata 和能力无关的 surface-owned entity 生命周期，消息操作通过 DSH HEAD 原生 `user/message`／`assistant/message` replacement 的 `surfaceOp` 与 `sourceEventSeqs` 改变当前 surface，不增加 Harness 消息事件类型，也不截断或改写原日志。编辑只用同类型原生消息替换当前消息；删除从所选消息开始裁剪当前可见对话尾部，并以带完整 target 列表的空内容原生助手 replacement 作为持久控制载体，该载体必须从模型历史投影为 `null`。用户消息不承载业务实体；成功 `rp_commit_turn` 的剧情 effect 和成功 `rp_state` 配置均由发起它们的助手 surface 持有，删除范围内所有助手 entity 都必须失活，投影从日志中的 bootstrap 与剩余活跃助手 entity 重建。只有当前最后一条可恢复的用户或助手消息可以重新生成；重新生成使用同类空助手 replacement 撤销所属 turn 的当前 surface 历史和助手实体，在 `rpMessageAction.replay` 中持久保存该轮当前仍存在的全部用户纯文本，再按顺序送回同一 Agent；不得使用空用户消息承载控制意图。复制、行内编辑、删除、重新生成、保存并重新生成、分支与失败恢复由插件自定义 Conversation Nodes 及公开的 `conversation.chat.node`、`commandview`、`turnTail`、局部 Portal 呈现。消息操作不得创建、切换或归档其他 Session；共享资料写入不因编辑或删除消息而回滚，新 turn 重新读取当前共享资产并记录新的上下文 snapshot。
- State 是当前 Session 私有的可变事实源：初始化 seed 与后续成功提交都记录在 Session Log，当前投影与角色卡、世界书等被引用事实源处于同一模型上下文输入层。当前楼层提交更新它，下一楼层读取更新后的投影；不得仅把它当作 UI 结果或脱离 Session 的附属缓存。任何需要跨楼层持续的 extension 也必须拥有从 Session Log 重建的投影和下一楼层上下文源。
- 每个 Harness turn 对应的 `RpRun`、上下文组装缓存、诊断和提交中状态只能是当前 Agent/Session 的临时运行态。它们不得跨 Session 共享，也不得在未形成成功 Session Event 时成为持久业务事实。
- 模型可见的 RP 上下文必须来自当前 Session 的 profile、当前共享事实源和状态，并以 snapshot 消息写入同一 Session Log。插件进程内缓存、客户端状态或未记录的旁路数据不得绕过该 snapshot 直接影响模型请求。
- `rp_commit_turn` 的成功 `tool/result` 是一个 turn 内叙事、state 和 extension effect 的唯一原子提交点。中间模型 step 和普通工具调用不得直接修改当前会话的权威 RP 状态。
- 删除角色卡不以任何 live、cold、已归档或正在运行的 Session 为前置条件，也不恢复、改写、归档或删除关联 Session。Session Event Log 中既有 live 引用允许保留；角色卡、宏、世界书、兼容适配器和会话管理界面在读取时把已不存在的角色卡视为未绑定，已有消息、开场白和状态保持可见，下一轮不再注入被删除内容，用户可以继续对话或重新绑定其他角色卡。确认弹框同时提供“删除关联世界书”勾选项且默认勾选；取消勾选时保留世界书。关联世界书清理失败不得回滚或阻止角色卡删除，失败项保持可见以便单独管理。单独删除世界书也不得修改关联角色卡。永久删除 Session 仍需 Harness 提供公开删除能力。
- Host 全局插件只负责资产库、反向引用查询、入口编排和按 Session 寻址；preset 私有 service 可以复用，但所有可变会话数据必须以 Agent/Session 分键。用户人设等资产一旦参与当前会话，也必须先扩展 Session 绑定协议，不能从全局选择或客户端状态直接注入模型。

## 仓库边界

- DeepSeek Harness 是独立上游项目。除非插件机制无法满足已确认需求，或用户明确要求修改，否则不要改动上游源码。
- `plugins/<plugin-name>/`：一个插件一个独立目录。插件之间不得通过相对路径读取彼此的内部文件；共享能力应抽成新的独立包或通过 Cordis service 连接。
- 新功能优先使用 Harness 已公开的 service、event、tool、bundle 和 patch 扩展点，不在 agent loop 中加入 roleplay 特例。
- 涉及 Harness 扩展点时，先核对对应版本的上游架构和公开 API；上游改动不得混入本仓库。

## 插件目录约定

每个可安装插件至少包含：

```text
plugins/<plugin-name>/
├── package.json
├── cordis.patch.yml
├── README.md
├── src/
└── test/
```

- 插件 package 使用 ESM，包名以 `dsh-roleplay-` 开头。
- `package.json` 声明 `dsh.bundle.patch`，使插件可以通过 `dsh plugin --profile <name> add <path>` 安装。
- 函数插件只具名导出 `name`、`inject`、`Config`、`apply`，不同时提供默认导出。
- 所有注册必须由 `ctx` 生命周期持有；使用 `ctx.tools.register()`、`ctx.on()`、`ctx.effect()` 或返回 disposer 的 service API，保证卸载和 HMR 能清理资源。
- 对其他 Harness 能力的硬依赖必须写入 `inject`。插件不得靠加载顺序等待依赖。
- 部署可变参数放进 Schemastery `Config`；无效配置在加载时明确失败，不做静默降级。
- 模型可见能力应返回结构化 canonical JSON；面向模型的说明放在 renderer，界面卡片放在纯 `presentCall` / `presentResult` 投影。

## 插件 UI 与交互

- 所有用户可见文案，包括标题、说明、按钮、提示、空状态、错误、Tooltip 和无障碍名称，都必须作为产品内容单独设计和审阅。文案应优先说明用户正在做什么、接下来会发生什么、可能造成的影响以及可执行的下一步，不得把变量名、接口名或开发流程直译到界面。
- UI 默认使用“对话、消息、回复、角色卡、世界书”等用户能直接理解的概念。除非某个内部概念已经被明确设计为必要的产品能力，否则不得暴露 Session、turn、floor／楼层、fork／分支、entity／实体、projection、snapshot、CAS、RPC、service、revision、hash 等实现术语，也不得用“对象”“处理”“操作失败”等抽象占位语代替具体反馈。
- 错误文案不得直接展示错误码、异常文本或内部服务名；必须转译为用户可理解的结果、原因和恢复方式。行为变更时，必须同步审阅相关确认弹框、Tooltip、无障碍名称和错误状态，并用组件测试及真实 Harness 组合验证最终可见文案。
- 插件的 UI 动效与交互反馈必须统一使用 [Motion for React](https://motion.dev/docs/react)（`motion` 包、`motion/react` 入口）实现，不得为同类能力另行引入动画库或在各组件中散落手写动画实现。
- Motion 没有提供所需的现成组件或交互模式时，使用 Motion primitives 封装可复用组件；确实无法由 Motion primitives 实现时，自行实现与 Motion 的声明式 API、弹簧/缓动语义、手势反馈和布局过渡体验一致的组件，并集中维护，禁止各插件各自实现行为不一致的版本。
- 所有动效组件必须支持 `prefers-reduced-motion` / `useReducedMotion`，保留无动效时的完整功能和明确反馈；交互行为变更须覆盖组件测试，并通过真实 Harness 组合验证用户可见效果。

## 工程质量

- 修复根因，不用模拟成功、吞错或无需求的兼容路径掩盖问题。
- 文件、网络、模型输入、持久化数据等外部边界必须校验；同进程的已类型化接口不重复做防御性校验。
- 文件大小、文本量、结果条数和执行时间等上限必须作用于完整结果，并覆盖恰好命中上限和超限的测试。
- 读取工作区文件优先使用 Harness 的 `ctx.fs`，以保留当前 provider、沙箱和远程执行语义；插件私有持久化由插件自己限定到配置目录。
- 外部角色卡中的 `system_prompt`、`post_history_instructions` 等可执行提示内容不得未经用户选择直接进入模型上下文。
- 导入图片对外作为头像存储前，必须剥离承载原始角色卡、EXIF 或其他私有内容的元数据。
- 行为变更同步更新插件 README 和测试。无法执行真实组合验证时，在交付说明中写清缺少的证据。

## 验证优先级

按风险从窄到宽执行：

1. 纯解析、校验、持久化单元测试。
2. 插件入口语法或类型检查。
3. 通过 Loader 加载 `cordis.patch.yml` 的组合测试。
4. 在 Web 或 headless profile 中实际调用工具的冒烟测试。

不要为了插件功能顺带整理或重构上游 Harness。发现主项目缺少扩展点时，先记录缺口、影响和最小上游改动，再请求用户确认。
