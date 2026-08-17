# ⚠️ 提交说明 / PR Notice

> [!IMPORTANT]
>
> - 请提供**人工撰写**的简洁摘要，避免直接粘贴未经整理的 AI 输出。

## 📝 变更描述 / Description

(简述：做了什么？为什么这样改能生效？请基于你对代码逻辑的理解来写，避免粘贴未经整理的内容)

## 🚀 变更类型 / Type of change

- [ ] 🐛 Bug 修复 (Bug fix) - _请关联对应 Issue，或说明内部事件 / 生产问题背景；避免将设计取舍、理解偏差或预期不一致直接归类为 bug_
- [ ] ✨ 新功能 (New feature) - _重大特性建议先通过 Issue 沟通_
- [ ] ⚡ 性能优化 / 重构 (Refactor)
- [ ] 📝 文档更新 (Documentation)

## 🔗 关联任务 / Related Issue

- Closes # (如有)
- Internal incident / task: (如无公开 Issue，请填写内部事件、生产排查背景或 N/A)

## 📦 工件信息 / Artifact

- Type: `portable Skill / cross-platform Plugin / Claude Code Plugin / Codex Plugin / repository tooling`
- Name:
- Related artifact or directory:
- Supported clients and tested versions:

## 🔐 能力与风险 / Capability And Risk

- [ ] 无可执行行为 (No executable behavior)
- [ ] 运行本地脚本或二进制文件 (Runs local scripts or binaries)
- [ ] 使用网络访问 (Uses network access)
- [ ] 使用身份验证或用户密钥 (Uses authentication or user secrets)
- [ ] 写入文件或外部状态 (Writes files or external state)
- [ ] 执行破坏性或对外可见操作 (Can perform destructive or externally visible actions)

请说明每项已勾选能力所需的最小权限、确认边界，以及回滚或恢复路径。

## ✅ 提交前检查项 / Checklist

- [ ] **人工确认:** 我已亲自整理并撰写此描述，没有直接粘贴未经处理的 AI 输出。
- [ ] **非重复提交:** 我已搜索当前仓库的 [Issues](https://github.com/aiman-labs/ergouzi-agent-skills/issues) 与 [PRs](https://github.com/aiman-labs/ergouzi-agent-skills/pulls)，确认不是重复提交。
- [ ] **Bug fix 说明:** 若此 PR 标记为 `Bug fix`，我已关联公开 Issue，或说明了对应的内部事件 / 生产问题背景。
- [ ] **变更理解:** 我已理解这些更改的工作原理及可能影响。
- [ ] **范围聚焦:** 本 PR 未包含任何与当前任务无关的代码改动。
- [ ] **Artifact 规范:** 工件名称、目录、清单和版本符合仓库规则。
- [ ] **插件自包含:** 插件运行时不依赖仓库外文件、私有路径或私有仓库内容。
- [ ] **文档同步:** 相关英文和简体中文用户文档保持一致。
- [ ] **本地验证:** 已在本地运行并通过测试或手动验证，维护者可以据此复核结果。
- [ ] **安全合规:** 代码中无敏感凭据、私有端点、生产数据或私有本地路径。
- [ ] **来源与许可证:** 已记录第三方来源和许可证，且确认允许再分发。

## 📸 运行证明 / Proof of Work

- Tests:
  - `...`
- Manual verification:
  - `...`
- Baseline without the artifact, when applicable:
  - `...`
- Result with the artifact:
  - `...`
- Not run:
  - `...`（如有，请说明原因）

## 🚢 部署影响 / Deployment

- Deployment required: `yes / no`
- Target / handoff: `...`

## ⚠️ 风险与回滚 / Risk & Rollback

- Risk: `...`
- Rollback: `...`

## 📚 来源与许可证 / Provenance And License

- Third-party sources:
- Third-party licenses:
