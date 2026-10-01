---
name: arina-document-intelligence-api-typescript-sdk
description: "TypeScript SDK for Arina Document Intelligence API. Use when writing TypeScript code that calls Arina Document Intelligence API with the @arina-ai/arina-grid-di package: installing it, constructing and authenticating the client, and calling API operations."
---

# Arina Document Intelligence API TypeScript SDK

Generated TypeScript client for Arina Document Intelligence API, published as `@arina-ai/arina-grid-di`. Use the generated client instead of hand-writing HTTP requests.

## Install

```sh
npm install @arina-ai/arina-grid-di
```

## Client setup and authentication

```ts
import ArinaDocumentIntelligenceAPI from '@arina-ai/arina-grid-di';

const client = new ArinaDocumentIntelligenceAPI({
  apiKey: process.env['ARINA_GRID_API_KEY'], // defaults to the ARINA_GRID_API_KEY env var
});
```

Provide credentials using the options below. Environment variables are read automatically when the target runtime supports them:

- `apiKey` (env: `ARINA_GRID_API_KEY`) — Credential for the ApiKey scheme.

## Calling operations

```ts
import ArinaDocumentIntelligenceAPI from '@arina-ai/arina-grid-di';

const client = new ArinaDocumentIntelligenceAPI({
  apiKey: process.env['ARINA_GRID_API_KEY'], // defaults to the ARINA_GRID_API_KEY env var
});

const extractRun = await client.extraction.createExtractRun({
  file: new File(['file'], 'file'),
  config:
    '{"organizationId": "org_123", "config": {"jsonSchema": {"type": "object", "properties": {"invoiceNumber": {"type": ["string", "null"]}, "invoiceTotal": {"type": ["number", "null"], "description": "Total amount due"}}}, "citationsEnabled": true}}',
});

console.log(extractRun);
```

Method names, parameter shapes, and response types are generated from the API description — do not guess them. Look up the exact call signature in [api.md](../../../api.md) before writing a call.

## Error handling

Non-success responses throw generated API errors. Error objects expose status, headers, response body, and request metadata where the target runtime supports it.

```ts
import { APIError } from '@arina-ai/arina-grid-di';

try {
  const extractRun = await client.extraction.createExtractRun({
    file: new File(['file'], 'file'),
    config:
      '{"organizationId": "org_123", "config": {"jsonSchema": {"type": "object", "properties": {"invoiceNumber": {"type": ["string", "null"]}, "invoiceTotal": {"type": ["number", "null"], "description": "Total amount due"}}}, "citationsEnabled": true}}',
  });
} catch (err) {
  if (err instanceof APIError) {
    console.log(err.status, err.name, err.headers);
  }
  throw err;
}
```

## Requirements

- Node.js 20+, a modern browser, or any runtime with `fetch` support

## Reference files

- [README.md](../../../README.md) — full feature tour: client options, request options, retries and timeouts, logging.
- [api.md](../../../api.md) — complete catalogue of every operation with request and response types.
