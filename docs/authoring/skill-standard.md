# Skill Authoring Standard

## Contract

Every portable Skill lives at `skills/<name>/SKILL.md`. The directory and
frontmatter `name` must match and use lowercase letters, digits, and single
hyphens. Colons, underscores, uppercase letters, consecutive hyphens, and
leading or trailing hyphens are invalid.

```yaml
---
name: example-skill
description: 'Describe what the Skill does and when an agent should use it.'
license: MIT
metadata:
  author: aiman-labs
  version: '0.1.0'
---
```

`description` is discovery metadata. State both capability and trigger context
in one concrete sentence, include terms users are likely to write, and keep it
under 1024 characters. Do not encode the full workflow in metadata.

Use `compatibility` only for real runtime requirements such as network access,
system packages, or a specific client feature. Use `allowed-tools` only when a
target client supports it and the restriction is meaningful.

## Structure

```text
skills/example-skill/
├── SKILL.md
├── scripts/          # Optional deterministic helpers
├── references/       # Optional on-demand documentation
└── assets/           # Optional output resources
```

`agents/openai.yaml` may be added for Codex UI metadata when needed. It is a
client extension, not a replacement for standard `SKILL.md` discovery fields.

Keep `SKILL.md` under 500 lines. Assume the agent is capable; include only
non-obvious domain knowledge, workflow constraints, resource routing, failure
rules, and verification requirements.

Link every supporting resource directly from `SKILL.md`. References longer than
100 lines need a contents section. Avoid references that merely point to deeper
references.

Do not add `README.md`, changelogs, installation guides, repository policies,
or process diaries inside a Skill directory.

## Behavioral Evidence

Structural validity is not behavioral proof. Add at least three representative
evaluation prompts and record observed behavior during development.

- Process or discipline Skills: capture a baseline without the Skill, enabled
  behavior, failure rationalizations, and a re-test after revisions.
- Technique Skills: cover normal use, edge cases, and missing information.
- Reference Skills: prove retrieval and correct application for representative
  questions.
- Scripts: test actual execution, error messages, unsafe input, and output
  validation.

Do not place evaluation artifacts inside the publishable Skill unless the agent
needs them at runtime. Keep development evidence in the pull request or an
approved repository-level test location.

## Verification

```bash
npm run validate
npm run validate:spec
npm test
```

Run the Skill in each claimed client or clearly record the unverified client as
a compatibility gap.
