# Contributing

TypeScript SDK for the Arina Document Intelligence API. The client is generated from the API's
public OpenAPI document; helpers, tests and automation are maintained here.

## File ownership

| Owner | Paths | Rule |
| --- | --- | --- |
| **Generator (Scalar)** | `src/**` except `src/lib/`; `api.md`; `SKILL.md`; `.claude/`; `scalar-sdk.manifest.json`; `tests/smoke-test.ts`; `biome.json`; `tsconfig*.json`; `scripts/finalize-build.mjs`; `scripts/publish-npm.mjs`; `.gitignore` | Never edit. Replaced by `scripts/import_sdk.py`. Fix upstream: the OpenAPI document (API repo, `openapi/generate.py`) or the generator config. |
| **This repo** | `src/lib/`; `tests/` (except `smoke-test.ts`); `scripts/import_sdk.py`; `.github/` (workflows, `release-config.json`, `release-manifest.json`); `CHANGELOG.md`; `CONTRIBUTING.md`; `SECURITY.md` | Normal code review. New helpers go in new modules under `src/lib/`. |
| **Generated once, then this repo** | `package.json`; `README.md`; `LICENSE`; `SECURITY.md` | Import never overwrites them; it prints a diff when the generated version changed (typically the `exports` map or a dependency) so the change can be ported by hand. |

Generated and hand-written code never share a file, so regeneration is a plain copy with no merge.
`package.json` is ours: it carries the `./lib` export, the dev tooling and the repository metadata.

## Regenerating after an API change

1. API repo: change the model or route, run `python openapi/spec.py build`, commit `openapi/openapi.public.json`.
2. Generator: upload that document, download the TypeScript zip.
3. Here, on a branch:

   ```sh
   python scripts/import_sdk.py ~/Downloads/<sdk>.zip
   git status          # generated paths changed; src/lib/ and tests/ untouched
   npm test            # wire-contract tests are the safety net
   ```

4. Commit with the prefix that matches the API change (below), open a PR, merge when CI is green.

The import restores the current version into `src/version.ts` (the zip always says `0.1.0`), rejects zips that
are not this SDK, and replaces the generator's empty default base URL (emitted when no environment is
configured) with a "baseURL is required" error so a key can never be sent to a host we do not own. Once a
production environment is configured in the generator, that step is a no-op.

## Commit messages

Conventional Commits on `main` drive versioning and the changelog (release-please, see RELEASING.md). With
*Squash and merge*, the PR title is the commit.

| Prefix | Release | Version (0.x) |
| --- | --- | --- |
| `fix:` | yes | patch |
| `feat:` | yes | minor |
| `feat!:` / `BREAKING CHANGE:` | yes | minor while 0.x, major from 1.0 |
| `docs:` `chore:` `ci:` `test:` `refactor:` | no | — |

## Local development

```sh
npm ci
npm run lint && npm run typecheck
npm test
npm run build && npm pack --dry-run
```

Tests are offline: `tests/helpers.ts` gives the client a recording `fetch` and the tests assert on the bytes
sent — for example that `config` is one multipart form field holding JSON, which is what the API's routes
parse. `tests/smoke-test.ts` is the generator's live reachability check; run it by hand.

## Known follow-ups

- Regenerate with the generator config set to `readEnv: ARINA_GRID_API_KEY` and `defaultEnvPrefix: ARINA_GRID`;
  the current client reads `API_KEY_AUTH` / `ARINA_BASE_URL`.
- Confirm the copyright holder in `LICENSE` is the legal entity name.
