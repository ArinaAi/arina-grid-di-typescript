# Changelog

## [0.2.0](https://github.com/ArinaAi/arina-grid-di-typescript/compare/v0.1.0...v0.2.0) (2026-10-29)


### ⚠ BREAKING CHANGES

* remove `organizationId` from run `config` JSON and from `client.extractors.*` params; the API key identifies the organisation. Requires a deployment that enforces API keys.

### Features

* the API key is the tenant — remove organizationId from requests, add whoAmI ([#5](https://github.com/ArinaAi/arina-grid-di-typescript/issues/5)) ([5d3e97c](https://github.com/ArinaAi/arina-grid-di-typescript/commit/5d3e97c0f2738b435268cb051308ad3f5f0bd019))
