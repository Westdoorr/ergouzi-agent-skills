# Versioning Policy

Use Semantic Versioning for every public Skill, Plugin, and repository release.

## Skills

- Patch: wording, validation, or compatibility fix without new behavior.
- Minor: additive workflow, supported input, tool, or reusable resource.
- Major: removed behavior, renamed Skill, changed required input, or other
  incompatible contract.

Store the version as a quoted string in `metadata.version`.

## Plugins

- Patch: compatible implementation or documentation fix.
- Minor: additive component or capability.
- Major: removed or renamed component, changed permissions, incompatible
  configuration, or migration requirement.

Cross-platform manifests must use the same version. Generated marketplace
entries take the version from the corresponding manifest.

## Repository

The framework begins at `0.1.0`. Repository tags describe a tested collection
of public artifacts; they do not replace per-artifact versions.

Renames are remove-and-add operations and are breaking for existing users.
Document migration and rollback before releasing a breaking change.
