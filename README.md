# dsh-roleplay

`dsh-roleplay` 是面向 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的 Roleplay 插件套件。它以独立 Cordis 插件提供资料管理、故事生成和对话增强。

## 功能

- **角色卡**：创建、编辑和导入 Character Card V1/V2/V3，支持 PNG、JSON、头像、默认开场与备用开场，并可将已保存修改和关联世界书导出为 Character Card V3 PNG。
- **世界书**：创建、导入和管理世界设定；支持常驻条目、关键词触发、递归激活、概率与变量条件。
- **我的人设**：保存用户身份、外观、背景、说话方式和头像，并按对话绑定。
- **创作预设与文风**：把剧情规则、写作要求和表达风格保存为可复用资料，自由排列进 Prompt。
- **会话配置**：选择角色卡、世界书、人设、预设、文风、开场和 Chat／Agent 执行模式。
- **故事变量**：在对话历史中持久保存状态变化，并提供安全的 MVU 角色卡兼容转换。
- **写作协作**：使用独立 Writer 生成正文，并可配置规划、润色等任务子代理。
- **Agent 工作区工具**：Agent 模式提供持久终端和 `str_replace_editor`，Chat 模式不开放工作区命令与文件编辑能力。
- **对话体验**：支持消息编辑、删除、重新生成、分支、角色头像和对白高亮。

## 安装

已安装 DeepSeek Harness 的用户，推荐直接从 npm 安装完整插件套件：

```bash
dsh plugin --profile web add -w @lutrodev/dsh-roleplay
```

安装完成后，下一次启动 `web` Profile 时会自动加载 Roleplay。npm 包已经包含运行所需的服务端源码、浏览器端构建产物、Skills 和 Roleplay 预设，不需要另外 clone 本仓库。

GitHub 仓库用于查看源码、调试和参与开发；普通使用请安装 npm 包。

## 使用方式

标准入口是 [`rp-feature-manager`](plugins/rp-feature-manager/README.md)。它组合仓库内的 Roleplay 插件，并在 Harness 设置中提供资料、创作增强、Skills 和对话体验开关；核心 Roleplay 运行时始终保留。

资料库初始为空，不内置角色卡、世界书或用户资料。导入角色卡时，潜在可执行提示会被隔离，头像会移除原卡与图片元数据。

各能力均位于 [`plugins/`](plugins/)，共享的浏览器工具位于 [`packages/`](packages/)。详细协议见 [Roleplay 架构](docs/rp-architecture.md)。

## 开发与调试

仓库包含构建、测试和真实 Harness Web 联调所需的公开入口，不需要复制作者的本机目录结构，也不需要另外 clone Harness 源码。开发用 Harness CLI 固定为插件套件声明的兼容版本。

### 环境准备

- Node.js `^22.19.0` 或 `>=24.0.0`，推荐使用 [`.nvmrc`](.nvmrc) 中的版本。
- pnpm `11.7.0`，可由 Corepack 按根 `package.json` 的声明启用。

```bash
git clone https://github.com/lutrodev/dsh-roleplay.git
cd dsh-roleplay
corepack enable
pnpm install --frozen-lockfile
```

### 检查与构建

```bash
# 运行兼容性检查、语法检查、全部测试和客户端构建
pnpm run verify

# 只生成各插件的浏览器端 dist/client.js
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

默认地址是 `http://127.0.0.1:3080`。启动器监听 `plugins/` 与 `packages/` 中会影响运行结果的源码和配置；保存后重新构建客户端并重启这个隔离 Host。调试模型调用前，请在该 Web 界面中自行配置模型提供方和凭据。

开发 Profile 与 Roleplay 数据默认分别写入仓库内的 `.dsh-dev/harness` 和 `.dsh-dev/data`。整个 `.dsh-dev/` 已被 Git 忽略，只是 clone 后运行调试命令产生的本地内容，不属于插件源码。需要复用其他位置时可以用绝对路径覆盖：

```bash
DSH_ROLEPLAY_DEV_HOME=/path/to/dev-profile \
DSH_ROLEPLAY_DEV_DATA_DIR=/path/to/dev-data \
pnpm dev
```

源码包之间使用 `workspace:` 依赖，不能把 `rp-feature-manager` 当作一个孤立目录直接执行 `dsh plugin add file:...`。`pnpm dev` 会把组合插件、全部依赖插件和共享 UI package 一次性链接到隔离 Profile，是 clone 后的源码联调入口。

按 `Ctrl+C` 会同时结束启动器和它启动的隔离 Harness 进程；`.dsh-dev/` 中的开发数据会保留，供下次调试继续使用。

## 许可

[MIT](LICENSE)
