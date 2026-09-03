# dsh-roleplay

`dsh-roleplay` 是面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的开源 Roleplay 插件套件。它通过独立 Cordis 插件提供资料管理、故事生成和对话增强，无需修改 Harness 源码。

## 主要能力

- **角色与资料**：管理角色卡、世界书、我的人设、创作预设和文风；支持 Character Card V1/V2/V3 的 JSON、PNG 导入，以及带最新角色资料和关联世界书的 V3 PNG 导出。
- **会话创作**：为每个对话选择资料、开场、Prompt 顺序和 Chat／Agent 模式；Writer 可继承全局模型设置，也可按会话覆盖模型与推理强度，Agent 模式还可使用持久终端、文件编辑器和任务子代理。
- **故事状态**：随对话持久保存角色状态、关系、物品和任务等变量，并安全转换常见 MVU 角色卡配置。
- **长对话续写**：在上下文压力升高时生成 Roleplay 专用前文总结，并通过原生 checkpoint 保留近期原文、支持后续续写与恢复。
- **对话体验**：提供快捷回复、提交后非阻断生成的回复选项、消息编辑／删除／重新生成／分支、角色头像、对白高亮、会话变量卡片和紧凑的访问模式按钮；快捷回复可逐项设置插入后的光标位置，回复选项可配置每轮生成 1–5 条以第三人称描述主角接下来对白和／或行为的消息、每条字数上限指导（默认 50）及对应的可选方向关键词，数量与字数只指导轻量结构化子代理，不参与核心提交或回放校验；数字与关键词都不进入实际消息，点击后在成功剧情回复下直接续写下一轮。

## 安装方式

先安装并启动 DeepSeek Harness。推荐直接在 DSH 对话中发送下面的内容，让 Agent 代为安装：

```text
请帮我安装下面的插件：
dsh plugin --profile web add -w @lutrodev/dsh-roleplay
安装完成后提醒我手动重启。
```

Agent 会自动完成安装。安装结束后，手动重启 DeepSeek Harness 即可加载插件。

也可以在终端中手动安装：

```bash
dsh plugin --profile web add -w @lutrodev/dsh-roleplay
```

npm 包已包含运行所需的插件、浏览器端资源、Skills 和示例配置，无需另外克隆源码仓库。

当前兼容组合为 dsh-roleplay `0.1.8` 与 DSH `0.1.2-alpha.5`，版本变化详见 [Changelog](CHANGELOG.md)。

## 使用

推荐入口是 [`rp-feature-manager`](plugins/rp-feature-manager/README.md)。它负责装载核心运行时，并在 Harness 的 Roleplay 设置中统一管理资料、创作增强、Skills 和可选的对话体验功能。

### 快速上手

1. **准备资料（可选）**：从侧栏打开“角色卡”，导入 Character Card 的 PNG 或 JSON 文件；也可以继续创建世界书和“我的人设”。如果只是体验功能，可以暂时跳过。
2. **进入 Roleplay**：新建对话，并在 Agent 预设中选择“Roleplay 模式”。
3. **设置故事**：点击“开始一段故事”中的“设置并开始”，按需选择角色卡、世界书、人设、创作预设和文风。所有资料都可以不选。
4. **选择开场**：点击“下一步：开场白”，选择角色卡开场、自定义开场或“跳过”，然后点击“创建并开始”。
5. **发送消息**：在输入栏选择 Chat 或 Agent。Chat 适合直接、快速地续写；Agent 会进行更多规划，并可使用资料工具、Skills 和任务子代理。
6. **后续调整**：通过对话顶部的“会话 Wiki”更换当前资料、查看故事状态；通过“写作 prompt”调整下一次回复参考的内容和顺序。

导入社区角色卡时，可按以下方式使用：

- **纯文字卡**：直接导入，角色设定、世界书和开场白会作为故事资料使用。
- **带 MVU 的纯文字卡**：保持“会话变量”和“MVU 兼容”功能开启，即可转换受支持的 MVU 初始化、变量更新规则和只读模板；动态脚本不会执行。
- **带轻度前端的卡**：可以按纯文字形式运行，继续使用卡内的角色设定、世界书和开场白；原卡的界面样式、交互组件和脚本不会加载。

角色卡和世界书资料库初始为空。首次启用相应功能时，插件会准备可编辑的“用户角色”占位人设、“示例预设”和“通用叙事”文风。导入角色卡时，潜在可执行提示会被隔离，头像会移除原始角色卡和图片元数据。

插件说明位于 [`plugins/`](plugins/)，共享浏览器能力位于 [`packages/`](packages/)，设计与数据协议见 [Roleplay 架构](docs/rp-architecture.md)。

## 开发

环境要求：Node.js `^22.19.0` 或 `>=24.0.0`（推荐使用 [`.nvmrc`](.nvmrc) 中的版本），以及 pnpm `11.23.0`（可由 Corepack 按根 `package.json` 的声明启用）。

```bash
git clone https://github.com/lutrodev/dsh-roleplay.git
cd dsh-roleplay
corepack enable
pnpm install --frozen-lockfile
```

常用命令：

```bash
pnpm run verify      # 兼容性、语法、测试和客户端构建
pnpm run build       # 生成 Host 与浏览器端产物
pnpm run dev:config  # 解析完整配置，不启动 Web 服务
pnpm dev             # 创建隔离 Profile 并启动本地 Web 调试
```

只修改单个插件时，可在对应目录运行 `pnpm run check`、`pnpm test`、`pnpm run build:client` 或 `pnpm run verify`。浏览器联调可用 `pnpm dev -- --port 3090` 指定端口，也可传入 `--skip-build` 或 `--no-watch`。

开发 Profile 与 Roleplay 数据默认写入 Git 忽略的 `.dsh-dev/harness` 和 `.dsh-dev/data`；可分别通过 `DSH_ROLEPLAY_DEV_HOME` 与 `DSH_ROLEPLAY_DEV_DATA_DIR` 指定其他绝对路径。

参与贡献前请阅读 [Contributing](CONTRIBUTING.md) 和 [AGENTS.md](AGENTS.md)。

## 许可

[MIT](LICENSE)
