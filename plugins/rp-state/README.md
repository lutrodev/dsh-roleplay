# Roleplay 会话变量

为每个故事保存结构化变量，例如角色状态、关系、物品、地点和任务进度。变量与对话历史一起保存，可在后续回复、重新打开对话或创建分支时继续使用。

Writer 只接收变量命名空间的名称、说明和当前值。Chat 与 Agent 的父 Agent 会在首步收到版本化的紧凑 `state_commit_contract`。每个 namespace 直接携带 `expectedRevision`、`updateMode`、`currentValue`、规则与必要约束；`rules-required` 中只有 `set`／`append` 规则携带目标 `valueSchema`，`increment`／`remove` 不重复根 Schema；`schema-only` 发送根 Schema 而不发送空 rules；禁用 namespace 不重复不可写 Schema。普通叙事轮直接依照这份契约提交，只有契约缺失或用户明确要求查看 State 时才调用 `rp_state_read`。

Agent 在本轮修改 State definition 或共享资料后，Core 会按新的 context epoch 重建 Writer 与提交视图；只有提交视图实际变化时，工具结果才携带完整 `commitContextReplacement`，并明确替代本轮更早的提交上下文。刷新失败时 Writer 与提交继续被阻断，旧 revision 不会被当作成功结果使用。

变量可以限制类型、范围和必填项，并支持设置、数值增减、数组追加和删除。界面会展示最近一次回复造成的变化；删除或重新生成相关回复时，变量也会恢复到对应的故事状态。

剧情更新采用严格的语义字段：设置和数组追加使用 `value`，数值增减使用 `by`，删除不携带值。校验先一次收集全部互相独立的静态问题，包括 ruleId、path、op、范围与 value 类型；静态问题清零后才按顺序判断条件、应用变更并校验最终 Schema，状态已不确定时不继续产生级联误报。每条问题都保留 namespace、changeIndex、ruleId 与精确 JSON Pointer，例如第 5 个变更的 `by` 指向 `/effects/0/payload/changes/4/by`，可用一次 retry 补丁修复。任何失败都保持整次提交原子性。
