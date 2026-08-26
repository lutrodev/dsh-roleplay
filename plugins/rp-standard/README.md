# Roleplay 标准组合

将 Roleplay 的核心运行时、资料能力、会话配置、Writer 和可选对话增强组装成 DeepSeek Harness 的 “Roleplay” 模式。

该包由功能管理插件统一安装和配置，通常不需要单独使用。角色卡、世界书、人设、预设、文风、会话变量、任务子代理及消息体验均可按需启用。

Roleplay 的 Chat 模式只保留叙事流程与资料只读工具。Agent 模式在此基础上开放与 Harness 极简模式相同的持久终端（POSIX 为 `bash`，Windows 为 `pwsh`）和 `str_replace_editor`；终端沿用部署的沙箱与 Session 工作区，编辑器复用部署当前的 `ctx.fs`，不会绕开现有文件系统权限或远程执行语义。

首次创建任务子代理目录时会预置“规划”和“润色”。“规划”只输出约 150～250 字的高层剧情脉络与推进节奏，具体动作、对白和场景细节由 Writer 决定。
