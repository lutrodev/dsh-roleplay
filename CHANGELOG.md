# Changelog

本项目遵循 [Semantic Versioning](https://semver.org/)。

## Unreleased

## 0.1.1 - 2026-08-26

- 角色卡详情页新增 Character Card V3 PNG 导出，导出内容以当前已保存的角色资料为准。
- 导出时合并最新关联世界书，并继续隔离可执行提示、清理原始卡片和图片元数据。
- 支持读取 PNG 中标准 `ccv3` 数据块，同时保留对既有 `chara` 数据块的兼容。

## 0.1.0 - 2026-08-25

- 将 Roleplay 插件套件整理为独立的 `dsh-roleplay` pnpm workspace。
- 移除本机开发环境、调试入口和外部社区夹具耦合，仓库依赖改用已发布的 Harness 包。
- 增加开源许可、贡献指南、安全策略和持续集成配置。
- 首个 Roleplay 插件套件版本。
