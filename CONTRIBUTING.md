# Contributing

Thank you for improving Ergouzi Agent Skills. This repository accepts public
Issues and pull requests for portable Skills, Claude Code plugins, Codex
plugins, and repository tooling.

## Before You Build

Open or find an Issue for substantial work. Explain the user problem, concrete
trigger prompts, supported clients, non-goals, and why a reusable artifact is
better than ordinary project documentation.

Do not submit private Ergouzi operations, personal paths, production endpoints,
credentials, account data, or redacted copies whose behavior still depends on
private infrastructure.

## Create An Artifact

```bash
npm install
npm run create:skill -- <name> --description "What it does and when to use it"
npm run create:plugin -- <name> --target <cross-platform|claude-code|codex> --description "Purpose"
```

Artifact names use lowercase letters, digits, and single hyphens. Choose a
short action-oriented name. A portable Skill directory must match its
frontmatter `name` exactly.

## Required Evidence

Every artifact pull request must include:

- at least three realistic user prompts or evaluation cases;
- baseline behavior without the artifact when the artifact teaches a process;
- enabled-artifact results and remaining limitations;
- exact local validation commands and observed outcomes;
- network, executable, authentication, destructive, and external-side-effect
  declarations;
- source and license provenance for third-party content;
- screenshots or recordings only when visual behavior requires them.

Pure reference Skills do not need artificial pressure tests, but they must show
successful retrieval and application against representative questions.

## Development Rules

- Keep `SKILL.md` focused; move heavy detail into directly linked references.
- Prefer deterministic scripts for fragile operations and test them with real
  inputs or safe fixtures.
- Keep plugins self-contained. Installed plugins cannot rely on files outside
  their plugin directory.
- Regenerate catalogs after plugin changes: `npm run catalog`.
- Do not hand-edit generated plugin arrays in marketplace files.
- Keep English and Simplified Chinese user documentation aligned.

## Local Checks

```bash
npm run check
npm run validate:spec
```

For Claude-compatible plugins, also run:

```bash
claude plugin validate --strict .
```

Record commands that could not run and the concrete environment limitation.
Never report an unexecuted check as passing.

## Review And Merge

Maintainers evaluate usefulness, portability, trigger quality, instruction
density, security, provenance, tests, and compatibility. Executable scripts,
hooks, MCP servers, apps, credentials, and write-capable integrations receive
heightened review.

Passing automation is necessary but not sufficient. CODEOWNERS approval is
required before merge. Branch, commit, push, publication, and release actions
remain maintainer-controlled.
