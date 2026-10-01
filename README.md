# Arina Document Intelligence API

This library provides convenient access to the Arina Document Intelligence API from TypeScript or JavaScript.

The full API of this library can be found in [api.md](./api.md).

<br />

## Contents

- [Installation](#installation)
- [Usage](#usage)
- [Waiting for a run](#waiting-for-a-run)
- [API Reference](./api.md)
- [Authentication](#authentication)
- [Errors](#errors)
- [Client Options](#client-options)
- [Request Options](#request-options)
- [Retries and Timeouts](#retries-and-timeouts)
- [Helpers](#helpers)
- [Logging](#logging)
- [Requirements](#requirements)

<br />

## Installation

```sh
npm install @arina-ai/arina-grid-di
```

<br />

## Usage

You need the base URL of the service you are using (Arina-hosted, or your organisation's own
deployment) and the API key that goes with it. Both are required: the client has no default host.

```ts
import { readFile, writeFile } from 'node:fs/promises';
import ArinaDocumentIntelligenceAPI from '@arina-ai/arina-grid-di';

const client = new ArinaDocumentIntelligenceAPI({
  apiKeyAuth: '<your key>',
  baseURL: 'https://<your base url>',
});

// Runs are asynchronous: POST returns 202 with a run id, then you poll.
// `config` is the ExtractRunRequest object as a JSON string (one multipart form field).
const run = await client.extraction.createExtractRun({
  file: new File([await readFile('invoice.pdf')], 'invoice.pdf', { type: 'application/pdf' }),
  config: JSON.stringify({
    organizationId: 'org_123',
    config: {
      jsonSchema: {
        type: 'object',
        properties: {
          invoiceNumber: { type: ['string', 'null'] },
          invoiceTotal: { type: ['number', 'null'], description: 'Total amount due' },
        },
      },
      citationsEnabled: true,
    },
  }),
});
console.log(run.id, run.status); // exr_..., PROCESSING
```

The examples in the following sections assume a `client` configured as shown above.

See the [API reference](./api.md) for every available operation.

<br />

## Waiting for a run

`@arina-ai/arina-grid-di/lib` adds helpers that poll a run until it reaches a terminal status
(`PROCESSED`, `FAILED`, `CANCELLED`), with backoff, a timeout and an optional `AbortSignal`:

```ts
import { waitForExtractRun } from '@arina-ai/arina-grid-di/lib';

const done = await waitForExtractRun(client, run.id, { timeoutMs: 120_000 });

const total = done.output?.value?.['invoiceTotal'];
// `citations` is an array when the value was located, [] when found but not located,
// and undefined/null when citations were disabled — so guard before iterating.
for (const citation of done.output?.metadata?.['invoiceTotal']?.citations ?? []) {
  console.log(citation.page?.number, citation.polygon, citation.referenceText);
}

// The page image the polygons were measured against:
const page = await client.extraction.listExtractRunPage(done.id);
await writeFile('page.jpg', Buffer.from(await page.arrayBuffer()));
```

`waitForParseRun` does the same for parse runs. A `FAILED` or `CANCELLED` run throws
`RunFailedError` (the run is on `.run`); pass `raiseOnFailure: false` to get it back instead.
Exceeding `timeoutMs` throws `RunTimeoutError`. Unknown statuses are treated as still running,
because status is an open string.

<br />

## Authentication

Pass credentials to the generated client constructor. Environment variables are read automatically when supported by the target runtime.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `apiKeyAuth` | `string \| provider` | - | Credential for the ApiKeyAuth scheme. Defaults to API_KEY_AUTH. |

Declared schemes:

- `ApiKeyAuth` API key in header `X-API-Key`

<br />

## Errors

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

Documented error statuses: `400`, `404`, `409`, `422`, `503`.

<br />

## Client Options

Configure the generated client by setting any of these options when you create it.

```ts
import ArinaDocumentIntelligenceAPI from '@arina-ai/arina-grid-di';

const client = new ArinaDocumentIntelligenceAPI({
  timeout: 60000,
  maxRetries: 2,
  logLevel: 'debug',
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `apiKeyAuth` | `string \| AuthTokenProvider` | `process.env["API_KEY_AUTH"]` | Credential for the ApiKeyAuth scheme. |
| `baseURL` | `string \| null` | `process.env["ARINA_BASE_URL"]` | Override the default API base URL. Pass `null` when selecting a configured environment. |
| `timeout` | `number` | `60000` | Maximum time in milliseconds to wait for a response before aborting a request. |
| `maxRetries` | `number` | `2` | Number of retries for temporary failures. |
| `defaultHeaders` | `HeadersInit` | - | Headers sent with every request. |
| `defaultQuery` | `Record<string, string \| undefined>` | - | Query parameters sent with every request. |
| `fetchOptions` | `RequestInit` | - | Additional fetch options sent with every request. |
| `fetch` | `Fetch` | - | Custom fetch implementation. |
| `logLevel` | `"off" \| "error" \| "warn" \| "info" \| "debug" \| null` | `process.env["ARINA_LOG"]` | Controls request and retry debug logging. |
| `logger` | `Logger \| null` | `console` | Custom logger implementation. |

<br />

## Request Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `headers` | `HeadersInit` | - | Per-request headers. |
| `query` | `Record<string, unknown>` | - | Per-request query parameters. |
| `body` | `unknown` | - | Override the generated request body. |
| `timeout` | `number` | - | Per-request timeout in milliseconds. |
| `maxRetries` | `number` | - | Per-request retry count. |
| `signal` | `AbortSignal` | - | Abort an in-flight request. |
| `fetchOptions` | `RequestInit` | - | Per-request fetch options. |
| `idempotencyKey` | `string` | - | Idempotency key for retry-safe operations. Applies to this request and its retries. |

<br />

## Retries and Timeouts

Generated clients support request timeouts and retry temporary failures such as network errors, 408, 409, 429, and 5xx responses. Retry delays honor `Retry-After` headers when present. Tune the retry and timeout client options shown above, or override them per request.

<br />

## Helpers

- Use `.withResponse()` on any request to inspect both parsed data and the raw `Response` object.
- Every operation returns an `APIPromise`, so you can `await` it directly or chain `.withResponse()`.

<br />

## Logging

- Set `logLevel: "debug"` to log request URLs, options, response status, response headers, and retry attempts.
- Pass a custom `logger` to route logs into your own observability pipeline.
- Set `logLevel: null` to disable environment-driven logging.

<br />

## Requirements

- Node.js 20+, a modern browser, or any runtime with `fetch` support

<br />

## Contributing

Client code under `src/` (except `src/lib/`) is generated from the API's OpenAPI document; helpers,
tests and release automation are maintained here. See [CONTRIBUTING.md](./CONTRIBUTING.md).
Security reports: [SECURITY.md](./SECURITY.md).

Client generated with Scalar.
