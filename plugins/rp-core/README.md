# Roleplay Core

Roleplay 的故事生成核心。它会汇总当前对话选中的角色卡、世界书、人设、创作预设、文风、会话变量和对话历史，再交给独立 Writer 生成结果。Writer 的固定系统层只负责执行本轮输入；内容取舍、角色控制、视角、文风、结构、节奏、篇幅与格式均由用户要求和当前绑定的预设、文风及输出要求决定。项目附带的示例预设和文风允许一个场景跨越多轮，使当前张力获得自然进展，并避免机械复用近期回复的推进路径、转折位置、表达节奏或收束方式。

Writer 使用的对话历史会把成功提交的故事正文标为“写作回复”，把讨论、解释、资料或配置等其他助手内容标为“非写作回复”。两类内容都保留原文，模型可以结合当前请求判断参考价值，但不会再把所有助手回复无差别呈现为故事正文；分类只依据成功提交记录，失败的提交调用不会被标为写作回复。

Chat 模式适合直接续写；Agent 模式还可以使用资料工具和任务子代理完成更复杂的规划与修改。每轮成功回复会同时保存正文及相关故事状态，保证重新打开、分支或回放时保持一致。示例预设不固定字数、段数或对白比例；模型仍受服务商上下文、输出上限及运行时安全边界约束，这些物理限制不作为凑字数或提前截断的写作目标。

角色卡、世界书、人设、创作预设和文风都是可选的实时资料。未绑定时直接生成；绑定资料被删除、损坏或超出可读限制时，Core 会把对应来源标为不可用并从本轮 Prompt 跳过，同时保留绑定 ID 供界面提示和 Agent 修复，不会因此阻断 Writer。运行服务、会话状态或非资料代码本身的错误仍会明确失败。

`rp_commit_turn` 全局只注册一个 Tool，不按当前 Agent 或 State revision 生成 shadow tool。它的完整提交分支从全局已注册 effect capability 的闭合 Schema 联合实时派生，因此模型看到的 effect 字段与运行时使用同一份 Schema；插件启停只改变下一次读取到的参数声明，不替换工具实例。父代理扩展仍保持独立的运行时注册与校验边界。完整提交与修复提交由同一固定顶层 `oneOf` 严格互斥：首次失败后 Core 只在当前 Run 缓存完整草稿，错误结果返回绑定 run、turn、Context Build 与 Writer 的 token；重试只能发送 `retry.token` 和有界的 RFC 6901 `add`／`replace`／`remove` 补丁，不能混入 summary、effects、references 或 extensions。重建后的完整草稿重新通过当前完整 Schema、能力 validator、guard、大小限制与 live context 校验后才原子提交；上下文、Writer 或提交轮次变化会立即使 token 失效，成功 token 也不可复用。

参数错误统一规范化为带稳定 code 的结构化结果。Core 在无写入预检中收集能够独立确认的 reference、effect、父代理扩展与 guard 问题，并保留能力返回的精确 JSON Pointer，不把深层路径压缩到 effect 根。effect capability 的同一闭合 Schema 同时进入模型侧 Tool 参数和执行前校验，领域 validator 再检查 revision、规则与 live context；未知 effect 或父代理扩展仍会失败。`registerArtifactExtension` 保留给真正由父代理提交的通用扩展。

Core 另提供 `registerArtifactGenerator`。生成器只在正文、State、guard 和提交诊断全部通过后运行，接收冻结的最终正文、summary、effects、references、角色／提交上下文和取消信号，不接触 live Session 或 Run。结构化子代理能力缺失、超时、格式错误、生成失败或单个派生产物超出字节限制时，只丢弃该产物并写入稳定诊断码，正文和核心 effect 仍正常提交；父级取消仍终止整个提交。

Chat 的首个父模型步骤会从同一份 Context Build 获得当前角色卡与用户人设，用于识别角色和用户控制身份；世界书、预设、文风和 Writer 的其他完整 Slot 仍不向 Chat 展开。Core 的上下文说明只声明 `<section name="人设信息"><item name="我的人设">` 的内容是 user-controlled protagonist，不把实际姓名或人设正文拼入 Tool Schema。两种模式同时在首步获得 Context Source 声明的提交专用上下文；普通叙事轮直接依照其中的紧凑契约提交，只有契约缺失或用户明确要求查看 State 时才调用读取工具。运行中资料刷新会同时重建 Writer 与提交视图，并使旧 retry token 失效。

Writer 的固定系统提示仅保留输入执行与结果交付约定，不规定正文形态或写法。连续性、角色控制、长程推进、信息释放、收束和默认篇幅全部由实时输入及对应资产栏位维护，避免高优先级规则重复或覆盖用户配置。
