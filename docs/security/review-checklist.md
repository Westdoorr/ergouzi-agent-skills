# Security Review Checklist

Apply this checklist to every new or materially changed Skill or Plugin.

## Scope And Intent

- [ ] The declared purpose matches the instructions and executable behavior.
- [ ] Tool, filesystem, network, authentication, and write scopes are minimal.
- [ ] External and destructive effects require explicit user confirmation.
- [ ] The artifact does not silently depend on private infrastructure.

## Data And Secrets

- [ ] No credentials, tokens, webhooks, private endpoints, or real account data.
- [ ] Secrets come from documented environment or ignored local configuration.
- [ ] Logs and errors do not expose sensitive values.
- [ ] Temporary sensitive files have explicit cleanup and restrictive handling.

## Execution

- [ ] Untrusted input is validated before file, process, URL, or query use.
- [ ] Process execution avoids shell interpolation and ambiguous executable lookup.
- [ ] Paths are resolved inside the intended root and reject traversal.
- [ ] Downloads have trusted origins and integrity verification where practical.
- [ ] Failure is safe, actionable, and does not leave partial external state.

## Distribution

- [ ] Every runtime file is inside the Skill or Plugin package.
- [ ] Third-party source and license provenance are documented.
- [ ] Manifest capabilities match actual components.
- [ ] Required validation and behavioral evaluation have been executed.
- [ ] Rollback or artifact removal is understood before release.
