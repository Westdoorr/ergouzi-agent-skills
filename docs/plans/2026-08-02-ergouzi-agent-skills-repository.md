# Ergouzi Agent Skills Repository Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a validated public-source repository framework for portable Agent Skills and Claude Code / Codex plugins without adding any real Skill or Plugin.

**Architecture:** Use a layered monorepo with portable artifacts under `skills/`, self-contained plugins under `plugins/`, platform-specific marketplace catalogs, and Node-based scaffold/validation tools. Treat official Agent Skills and Claude Code validation as external conformance layers while maintaining deterministic repository contracts and Codex JSON schemas locally.

**Tech Stack:** Node.js 22, npm, ES modules, `node:test`, YAML, Prettier, markdownlint-cli2, JSON Schema, GitHub Actions.

---

External Git operations are intentionally excluded. Do not commit, push, create
the GitHub repository, or configure branch protection without explicit user
authorization.

## Tasks

### Task 1: Register and initialize the repository boundary

**Files:**

- Modify: workspace root `.gitignore` (outside this child repository)
- Modify: workspace root `AGENTS.md` (outside this child repository)
- Create: repository-local `.git/`

**Steps:**

1. Add `/ergouzi-agent-skills/` to the workspace nested-repository ignore list.
2. Add the repository to Workspace Relationships, Repository Roles, repository
   split, and Git setup documentation as the approved public source for
   community Skills and Plugins.
3. Initialize `ergouzi-agent-skills` as a local `main` Git repository without a
   remote.
4. Verify root status shows only the pre-existing unrelated untracked paths and
   intended governance edits; verify the child repository has no remote.

### Task 2: Add repository governance and bilingual public documentation

**Files:**

- Create: `AGENTS.md`
- Create: `README.md`
- Create: `README.zh-CN.md`
- Create: `CONTRIBUTING.md`
- Create: `CONTRIBUTING.zh-CN.md`
- Create: `SECURITY.md`
- Create: `CODE_OF_CONDUCT.md`
- Create: `LICENSE`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `.markdownlint-cli2.jsonc`
- Create: `package.json`

**Steps:**

1. Document the public source-of-truth boundary, portable Skill contract,
   plugin target classes, self-containment rule, and secret prohibition.
2. Document installation commands for portable Skills and both marketplaces,
   clearly marking remote commands as available after publication.
3. Add contribution, security-reporting, code-of-conduct, provenance, and
   license policies in English; mirror user/contributor guidance in Chinese.
4. Configure Node 22+, npm scripts, Markdown formatting, and linting.
5. Run Markdown format and lint checks; expect a clean pass.

### Task 3: Define templates and machine contracts

**Files:**

- Create: `templates/skill/SKILL.md.tmpl`
- Create: `templates/skill/agents/openai.yaml.tmpl`
- Create: `templates/plugin-cross-platform/**`
- Create: `templates/plugin-claude-code/**`
- Create: `templates/plugin-codex/**`
- Create: `schemas/codex-plugin.schema.json`
- Create: `schemas/codex-marketplace.schema.json`
- Create: `docs/authoring/skill-standard.md`
- Create: `docs/authoring/plugin-standard.md`
- Create: `docs/governance/versioning.md`
- Create: `docs/security/review-checklist.md`

**Steps:**

1. Encode standard Skill names, required metadata, progressive disclosure, and
   optional `agents/openai.yaml` rules in templates and documentation.
2. Encode cross-platform and single-platform plugin layouts with no unresolved
   placeholders in generated output.
3. Define strict Codex manifest and marketplace JSON schemas from the current
   locally installed ingestion contract.
4. Verify templates themselves cannot be discovered as live artifacts because
   manifest files use `.tmpl` suffixes.

### Task 4: Build repository validation with TDD

**Files:**

- Create: `test/validate-repository.test.mjs`
- Create: `scripts/lib/artifacts.mjs`
- Create: `scripts/validate-repository.mjs`
- Create: `scripts/validate-spec.mjs`

**Steps:**

1. Write failing tests for an empty valid repository, valid portable Skill,
   directory/name mismatch, colon namespace, invalid SemVer, malformed plugin
   target, missing cross-platform manifest, missing referenced files, path
   traversal, and catalog drift.
2. Run `node --test test/validate-repository.test.mjs`; verify failure is caused
   by missing implementation modules.
3. Implement artifact discovery, YAML parsing, JSON Schema validation, link/path
   checks, version consistency, and actionable error reporting.
4. Re-run the focused test; expect all cases to pass.
5. Add `validate-spec.mjs` to invoke pinned official `skills-ref` validation for
   each portable Skill and treat an empty `skills/` directory as a clean no-op.
6. Run the full test suite and repository validator.

### Task 5: Build safe scaffold commands with TDD

**Files:**

- Create: `test/create-artifact.test.mjs`
- Create: `scripts/create-skill.mjs`
- Create: `scripts/create-plugin.mjs`

**Steps:**

1. Write failing tests for name normalization rejection, existing-target
   protection, portable Skill output, and all three plugin target classes.
2. Run the focused test and confirm missing scaffold implementation is the
   expected failure.
3. Implement `create:skill` and `create:plugin` with explicit arguments,
   deterministic template rendering, no overwrite flag, and atomic writes.
4. Ensure generated manifests contain real normalized values and strict SemVer,
   never TODO markers.
5. Re-run focused and full tests; expect clean passes.

### Task 6: Generate deterministic catalogs with TDD

**Files:**

- Create: `test/generate-catalog.test.mjs`
- Create: `scripts/generate-catalog.mjs`
- Create: `.claude-plugin/marketplace.json`
- Create: `.agents/plugins/marketplace.json`
- Create: `docs/catalog.md`
- Create: `skills/.gitkeep`
- Create: `plugins/.gitkeep`

**Steps:**

1. Write failing tests covering empty catalogs, Claude-only, Codex-only, and
   cross-platform discovery plus deterministic ordering.
2. Run the focused test and verify the missing generator causes the failure.
3. Implement render and `--check` modes. Generate only from publishable plugin
   manifests; do not scan templates.
4. Generate initial empty marketplace and catalog files.
5. Run generator twice and prove byte-for-byte idempotence.
6. Run catalog drift checks and the complete test suite.

### Task 7: Add contribution and CI gates

**Files:**

- Create: `.github/CODEOWNERS`
- Create: `.github/PULL_REQUEST_TEMPLATE.md`
- Create: `.github/ISSUE_TEMPLATE/skill.yml`
- Create: `.github/ISSUE_TEMPLATE/plugin.yml`
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/config.yml`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/codeql.yml`
- Create: `.github/dependabot.yml`

**Steps:**

1. Require artifact type, platform targets, trigger examples, capability and
   secret declarations, provenance, tests, and rollback/removal impact in PRs.
2. Add structured Skill, Plugin, and bug Issue forms.
3. Run npm install/format/lint/tests/repository validation/catalog drift checks
   in CI on supported Node versions.
4. Install `uv`, run pinned official `skills-ref`, and run
   `claude plugin validate --strict` when Claude-compatible artifacts exist.
5. Add CodeQL and Dependabot configuration without granting write permissions.

### Task 8: Verify the complete framework

**Files:**

- Modify only files required to remediate verified findings.

**Steps:**

1. Run `npm install` and retain the generated lockfile.
2. Run `npm run check`; expect zero failures and zero unexpected warnings.
3. Use temporary directories to scaffold one portable Skill and all three
   plugin target classes; validate them and remove only the temporary directory.
4. Run `skills-ref validate` on the temporary Skill.
5. Run `claude plugin validate --strict` against the repository marketplace and
   temporary Claude-compatible plugins.
6. Run secret-pattern and path-traversal scans over tracked candidate files.
7. Run an independent contract/security/governance review; reproduce and fix
   accepted findings, then repeat relevant verification.
8. Record CatPaw review and test Evidence, update CHORE-089 acceptance, and
   close the Work Item only when all local acceptance conditions pass.

### Task 9: Report ship readiness without publishing

**Files:**

- No additional files unless verification finds a documentation gap.

**Steps:**

1. Report the exact changed-file set and added/deleted line counts for the
   workspace root and child repository separately.
2. Report executed verification, unavailable checks, and remaining risks.
3. State that GitHub creation, commit, push, branch protection, and public
   publication have not occurred.
4. Ask for explicit authorization before any external Git/GitHub operation.
