# Ergouzi Agent Skills Repository Design

## Status

Approved for implementation on 2026-08-02.

## Goal

Create `aiman-labs/ergouzi-agent-skills` as the directly maintained public
source of truth for reusable Agent Skills and Claude Code / Codex plugins.
The repository must be useful before it contains its first real Skill: team
members need stable templates, deterministic validation, contribution rules,
and platform-specific distribution catalogs.

## Confirmed Decisions

- The repository is public and directly authored. It is not generated from the
  private `ergouzi-skills` repository or from any personal repository.
- Portable Skills follow the Agent Skills specification and target compatible
  clients including Codex, Claude Code, and `npx skills`.
- Plugins may be cross-platform, Claude Code-only, or Codex-only.
- Community Issues and pull requests are accepted behind automated and human
  quality gates.
- Repository content is MIT licensed. Third-party material requires provenance
  and license compatibility review.
- English is normative; Simplified Chinese documentation mirrors the public
  user-facing guidance. Code, configuration, and comments use English.
- The initial repository contains no placeholder or demonstration Skill in the
  public install paths.

## Repository Architecture

```text
ergouzi-agent-skills/
├── skills/                         # Portable installable Agent Skills
├── plugins/                        # Self-contained publishable plugins
├── templates/
│   ├── skill/
│   ├── plugin-cross-platform/
│   ├── plugin-claude-code/
│   └── plugin-codex/
├── docs/
│   ├── authoring/
│   ├── governance/
│   ├── security/
│   └── plans/
├── schemas/                        # Repository-owned plugin contracts
├── scripts/                        # Scaffold, validation, and catalog tools
├── test/                           # Node contract tests and fixtures
├── .github/                        # CI, ownership, and contribution forms
├── .claude-plugin/marketplace.json
└── .agents/plugins/marketplace.json
```

### Portable Skills

`skills/<name>/` is a public installation unit. Its directory name must exactly
match `SKILL.md` frontmatter `name`. Names use lowercase ASCII letters, digits,
and single hyphens; namespaced forms containing `:` are forbidden.

The supported Skill shape is:

```text
skills/<name>/
├── SKILL.md
├── agents/openai.yaml              # Optional Codex UI metadata
├── scripts/                        # Optional deterministic helpers
├── references/                     # Optional on-demand documentation
└── assets/                         # Optional output resources
```

`SKILL.md` requires the standard `name` and `description` fields. Public Skills
also declare `license: MIT` and string-valued `metadata.author` and
`metadata.version`. `compatibility` is included only when real runtime
requirements exist. `metadata.visibility` is not used because repository
membership already means public.

Skill instructions use progressive disclosure: keep the entrypoint concise,
link every optional resource directly from `SKILL.md`, and avoid reference
chains deeper than one level. A Skill directory must not contain its own
README, changelog, contribution guide, or repository policy files.

### Plugins

`plugins/<name>/` is a self-contained distribution unit. Platform support is
declared by manifest presence:

- `.claude-plugin/plugin.json`: Claude Code support.
- `.codex-plugin/plugin.json`: Codex support.
- Both manifests: cross-platform support.

A plugin may contain shared `skills/`, scripts, references, and assets alongside
platform-specific components. It must remain valid after being copied into an
isolated plugin cache. No plugin file may depend on `../` paths or root-level
shared implementation files.

### Templates

Templates are scaffold inputs, never publishable artifacts. Template files use
`.tmpl` suffixes so repository discovery cannot mistake placeholders for live
Skills or manifests. Scaffolding replaces every placeholder and refuses to
overwrite an existing target.

## Distribution Catalogs

Claude Code and Codex use separate marketplace schemas:

- `.claude-plugin/marketplace.json` is authoritative for Claude Code.
- `.agents/plugins/marketplace.json` is authoritative for Codex.

The catalog generator discovers plugin manifests and deterministically renders
both catalogs. A plugin appears only in the catalog for a platform whose
manifest exists. Catalog files are checked for drift in CI. Empty catalogs are
valid before the first plugin is added.

Portable Skills remain directly discoverable under `skills/`; they are not
wrapped in synthetic plugins merely to populate a marketplace.

## Repository Tooling

Use Node.js 22 and built-in `node:test` for repository automation. YAML parsing
uses a maintained parser rather than a handwritten frontmatter regex.

Commands:

| Command                                             | Contract                                            |
| --------------------------------------------------- | --------------------------------------------------- |
| `npm run create:skill -- <name>`                    | Scaffold one portable Skill                         |
| `npm run create:plugin -- <name> --target <target>` | Scaffold one plugin                                 |
| `npm run catalog`                                   | Regenerate both marketplaces and the human catalog  |
| `npm run catalog:check`                             | Fail when generated catalogs drift                  |
| `npm run validate`                                  | Validate repository-owned contracts                 |
| `npm run validate:spec`                             | Run official `skills-ref` for every portable Skill  |
| `npm test`                                          | Run repository tool contract tests                  |
| `npm run check`                                     | Run formatting, tests, validation, and drift checks |

The local validator must accept an empty repository, reject malformed or
mismatched Skill names, reject invalid semver, reject unknown plugin targets,
detect missing assets and manifests, reject path traversal, and ensure catalogs
match discovered artifacts.

Official validators supplement rather than replace repository checks:

- `skills-ref validate` for portable Agent Skills.
- `claude plugin validate --strict` for Claude Code manifests/catalog.
- Repository-pinned JSON schema checks for Codex manifests/catalog because the
  current Codex CLI exposes installation commands but no standalone validator.

## Contribution And Review

Every contribution uses the repository Issue/PR templates and declares:

- artifact type and supported platforms;
- user problem, trigger examples, and non-goals;
- external tools, network access, credentials, and destructive capabilities;
- test cases, including baseline and enabled-skill evaluation where applicable;
- third-party source and license provenance;
- verification commands and observed results.

Branch protection is an external GitHub configuration and is not part of the
local scaffold. The intended merge gate is CI success plus CODEOWNERS review.

## Security Boundary

The public repository must never contain production endpoints, internal server
paths, credentials, account data, webhook URLs, or instructions that silently
depend on Ergouzi private infrastructure. Skills and plugins must minimize tool
scope, declare network/runtime requirements, validate untrusted input, avoid
shell injection, and require explicit user confirmation before external or
destructive actions.

Executable contributions receive heightened review. CI performs dependency and
secret scanning in addition to repository contract checks.

## Versioning And Release

- Each Skill uses `metadata.version` with Semantic Versioning.
- Each plugin manifest uses the same strict SemVer version across its supported
  platforms.
- Marketplace entries are generated from plugin manifests and must not diverge.
- Repository releases use repository-level SemVer tags after real public
  artifacts exist; the empty framework starts at `0.1.0`.
- Removing or renaming a public artifact is breaking. Additive artifacts are
  minor changes; compatible fixes are patch changes.

Creating the GitHub repository, committing, pushing, branch protection, and
publishing releases remain separately authorized external actions.

## Acceptance

- The repository is an independent local Git repository with no remote.
- English and Chinese user documentation agree on installation and governance.
- Empty `skills/` and `plugins/` states pass validation.
- Scaffold commands create valid temporary artifacts without publishing them.
- Cross-platform and single-platform plugin fixtures produce correct catalogs.
- Tests, formatting, repository validation, catalog drift checks, and available
  official validators pass.
- An independent review finds no unresolved high-impact contract, security, or
  contribution-governance issue.
