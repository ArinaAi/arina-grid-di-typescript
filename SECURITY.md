# Security Policy

## Reporting a vulnerability

Report vulnerabilities in this SDK privately through
[GitHub Security Advisories](https://github.com/ArinaAi/arina-grid-di-typescript/security/advisories/new).
Do not open a public issue, and do not include API keys or document contents in a report.

We acknowledge reports within five business days, triage for severity and impact, and share a
fix timeline or a reason for declining.

Vulnerabilities in the Arina Document Intelligence API or service itself should go through your
Arina support contact, not this repository.

## Scope

The SDK runtime (authentication headers, request construction, serialization, retries) and the
helpers under `@arina-ai/arina-grid-di/lib`. The generated client code is produced from the API's
OpenAPI document; issues that originate in the generator are forwarded upstream by us.

## Supported versions

The latest release on npm. Fixes are shipped as new releases, not backported.
