# 参与贡献

感谢参与 Ergouzi Agent Skills。本仓库接受 portable Skills、Claude Code Plugins、
Codex Plugins 及仓库工具相关的公开 Issue 与 Pull Request。

## 开发前

较大改动请先创建或关联 Issue，说明用户问题、具体触发提示词、支持的客户端、非目标，
以及为什么该能力适合做成可复用产物，而不是普通项目文档。

禁止提交二狗私有运维资料、个人路径、生产地址、凭据、账号数据，或表面脱敏但运行时
仍依赖私有基础设施的内容。

## 创建产物

```bash
npm install
npm run create:skill -- <name> --description "说明功能和触发场景"
npm run create:plugin -- <name> --target <cross-platform|claude-code|codex> --description "用途"
```

名称只能使用小写字母、数字和单连字符，优先采用简短的动作型命名。Portable Skill
目录名必须与 frontmatter `name` 完全一致。

## 必须提供的证据

每个产物 PR 必须包含：

- 至少三个真实用户提示词或 evaluation case；
- 对流程类 Skill，记录未启用产物时的 baseline；
- 启用产物后的结果和仍存在的限制；
- 实际执行的本地验证命令和结果；
- 网络、可执行文件、认证、破坏性操作及外部副作用声明；
- 第三方内容的来源和许可证记录；
- 仅在视觉行为需要时提供截图或录屏。

纯参考型 Skill 不要求虚构压力测试，但必须证明代表性问题能够正确检索并应用资料。

## 开发规则

- 保持 `SKILL.md` 聚焦，较重内容放入由入口直接链接的 references。
- 对脆弱操作优先提供确定性脚本，并使用真实输入或安全 fixture 测试。
- Plugin 必须自包含，安装后不能依赖 Plugin 目录之外的文件。
- Plugin 变更后运行 `npm run catalog`，禁止手改 marketplace 里的生成数组。
- 英文与简体中文用户文档必须保持一致。

## 本地检查

```bash
npm run check
npm run validate:spec
```

Claude-compatible Plugin 还应运行：

```bash
claude plugin validate --strict .
```

无法执行的命令必须记录具体环境限制，未运行的检查不能声称通过。

## 审查与合并

维护者会审查价值、可移植性、触发质量、指令密度、安全、来源、测试和兼容性。包含
脚本、hooks、MCP servers、apps、凭据或写操作能力的贡献需要更严格审查。

自动检查通过只是必要条件，合并前还必须获得 CODEOWNERS 审批。分支、提交、推送、
发布与 Release 由维护者控制。
