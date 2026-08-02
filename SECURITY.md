# Security Policy

## Report A Vulnerability

Do not open a public Issue for a vulnerability, leaked secret, or exploitable
artifact behavior. After publication, use GitHub Private Vulnerability Reporting
for `aiman-labs/ergouzi-agent-skills`. Until then, contact an Aiman Labs
maintainer through an already established private channel.

Include the affected artifact and version, impact, reproduction steps, required
permissions, and a safe proof of concept. Do not include real credentials or
production user data.

## Supported Content

Security fixes target the latest repository state. Maintainers may remove or
disable a vulnerable Skill or Plugin immediately rather than preserve a broken
interface.

## Public Artifact Requirements

- No embedded credentials, tokens, private endpoints, or production data.
- Minimal tool and filesystem scope.
- Explicit authentication, network, executable, and side-effect disclosure.
- Input validation and safe process execution without shell interpolation.
- User confirmation before destructive or externally visible operations.
- License and provenance review for third-party code and content.

Installing a Skill or Plugin grants instructions and potentially executable
code access to an agent. Review the source and required capabilities before use.
