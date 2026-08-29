# dsh-roleplay

`dsh-roleplay` 是面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Roleplay 插件套件。它以独立 Cordis 插件提供资料管理、故事生成和对话增强。

## 功能

- **角色卡**：创建、编辑和导入 Character Card V1/V2/V3，支持 PNG、JSON、头像、默认开场与备用开场，并可将已保存修改和关联世界书导出为 Character Card V3 PNG。
- **世界书**：创建、导入和管理世界设定；支持常驻条目、关键词触发、递归激活、概率与变量条件。
- **我的人设**：保存用户身份、外观、背景、说话方式和头像，并按对话绑定。
- **创作预设与文风**：把剧情规则、写作要求和表达风格保存为可复用资料，自由排列进 Prompt。
- **会话配置**：选择角色卡、世界书、人设、预设、文风、开场、Chat／Agent 执行模式，以及当前 Writer 的模型与推理强度。
- **故事变量**：在对话历史中持久保存状态变化，并提供安全的 MVU 角色卡兼容转换。
- **写作协作**：使用独立 Writer 生成正文，并可配置规划、润色等任务子代理；Writer 以全局设置作为会话默认值，当前会话可单独覆盖模型与推理强度，任务子代理仍使用各自的全局配置，二者都能直接读取本轮图片附件。
- **长对话续写**：达到模型上下文压力后并发生成 Roleplay 专用前文总结，下一轮通过原生 checkpoint 与独立“会话总结” Slot 接续近期原文。
- **Agent 工作区工具**：Agent 模式提供持久终端和 `str_replace_editor`，Chat 模式不开放工作区命令与文件编辑能力。
- **对话体验**：支持可自定义快捷回复、消息编辑、删除、重新生成、分支、角色头像、对白高亮、可选的回复下方会话变量卡片，以及所有输入栏宽度下只显示图标的访问模式按钮。

## 安装

已安装 DeepSeek Harness 的用户，推荐直接从 npm 安装完整插件套件：

```bash
dsh plugin --profile web add -w @lutrodev/dsh-roleplay
```

安装完成后，下一次启动 `web` Profile 时会自动加载 Roleplay。npm 包已经包含运行所需的服务端源码、浏览器端构建产物、Skills 和 Roleplay 预设，不需要另外 clone 本仓库。

GitHub 仓库用于查看源码、调试和参与开发；普通使用请安装 npm 包。

> 当前 `main` 上的 0.1.7 正在适配 DSH `0.1.2-alpha.1`。该 DSH alpha 的 workspace packages 尚未发布到 npm，因此 0.1.7 暂不能从全新 checkout 独立安装或发布；上面的 npm 命令仍对应已发布的稳定版。维护者联调请使用同时包含 `deepseek-harness/`、`dsh-roleplay/` 与根目录 `dev.sh` 的本地集成工作区。

## 使用方式

标准入口是 [`rp-feature-manager`](plugins/rp-feature-manager/README.md)。它组合仓库内的 Roleplay 插件，并在 Harness 设置中提供资料、创作增强、Skills 和对话体验开关；核心 Roleplay 运行时始终保留。

资料库初始为空，不内置角色卡、世界书或用户资料。导入角色卡时，潜在可执行提示会被隔离，头像会移除原卡与图片元数据。

各能力均位于 [`plugins/`](plugins/)，共享的浏览器工具位于 [`packages/`](packages/)。详细协议见 [Roleplay 架构](docs/rp-architecture.md)。

## 开发与调试

### 环境准备

- Node.js `^22.19.0` 或 `>=24.0.0`，推荐使用 [`.nvmrc`](.nvmrc) 中的版本。
- pnpm `11.23.0`，可由 Corepack 按根 `package.json` 的声明启用。

```bash
git clone https://github.com/lutrodev/dsh-roleplay.git
cd dsh-roleplay
corepack enable
pnpm install --frozen-lockfile
```

上述独立安装流程适用于已发布依赖。开发 0.1.7 alpha 适配时，先把上游 `deepseek-harness` checkout 放在同一集成工作区，再从工作区根目录运行 `./dev.sh --dump-config` 做无端口配置校验，或运行 `./dev.sh` 联调；启动脚本会把所需 DSH packages 链接到固定的本地 checkout，且不会把本地路径写进公开 lockfile。

### 检查与构建

```bash
# 运行兼容性检查、语法检查、全部测试和客户端构建
pnpm run verify

# 生成 typed Remote Host 产物及各插件的浏览器端 dist/client.js
pnpm run build

# 只验证完整 Harness 配置能否解析；不会监听端口或启动 Web 服务
pnpm run dev:config
```

只修改一个插件时，也可以在其目录运行 `pnpm run check`、`pnpm test`、`pnpm run build:client` 或 `pnpm run verify`。没有 `build:client` 的纯服务端插件不需要单独生成构建产物。

### 浏览器联调

```bash
# 构建、创建隔离 Profile、链接所有 workspace package，并启动 Web
pnpm dev

# 改用其他端口；其余未知参数会原样传给 dsh web
pnpm dev -- --port 3090

# 已构建时跳过首次构建，或关闭保存后的自动重建
pnpm dev -- --skip-build
pnpm dev -- --no-watch
```

开发 Profile 与 Roleplay 数据默认分别写入仓库内的 `.dsh-dev/harness` 和 `.dsh-dev/data`。整个 `.dsh-dev/` 已被 Git 忽略，只是 clone 后运行调试命令产生的本地内容，不属于插件源码。需要复用其他位置时可以用绝对路径覆盖：

```bash
DSH_ROLEPLAY_DEV_HOME=/path/to/dev-profile \
DSH_ROLEPLAY_DEV_DATA_DIR=/path/to/dev-data \
pnpm dev
```

## 许可

[MIT](LICENSE)
