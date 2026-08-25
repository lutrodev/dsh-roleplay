# Contributing

感谢你参与 dsh-roleplay。提交变更前，请先阅读 [AGENTS.md](AGENTS.md) 中的架构边界和工程约束。

首次 clone 后的依赖安装、构建、配置解析和浏览器联调命令见 [README 的“开发与调试”](README.md#开发与调试)。公开开发入口只在 Git 忽略的 `.dsh-dev/` 中创建隔离 Profile 与测试数据，不依赖仓库外的源码。

## 提交要求

- 业务功能只修改 `plugins/` 或 `packages/`；上游 Harness 的改动必须在其独立仓库中完成。
- 行为变化同步更新对应 README 和测试。
- 至少运行受影响插件的 `pnpm run verify`；跨插件改动运行根目录 `pnpm run verify`。
- 不提交真实用户资料、凭据、会话记录、浏览器产物或来源不明的角色卡和世界书。

项目所需 Node.js、pnpm 和 DeepSeek Harness 版本以根 `package.json` 与 `rp-feature-manager/package.json` 为准。仓库依赖只使用已发布包和 workspace 内部包，不依赖仓库外的本地路径。
