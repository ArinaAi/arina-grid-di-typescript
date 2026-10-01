// File generated from our OpenAPI spec by Scalar. See README.md for details.

// Smoke test: calls every generated operation once to confirm the SDK can reach each endpoint.
// Run it from this repo with `bun tests/smoke-test.ts`. Each case below calls one SDK method
// exactly the way the SDK exposes it (positional params, request body, pagination, streaming).
//
// Two environment variables tune a run:
//   - SCALAR_SMOKE_FILTER: comma-separated needles; only operations whose name or path contains
//     one of them run, so you can smoke-test a subset without editing this file.
//   - SCALAR_SMOKE_REPORT: a file path; when set, the run writes a JSON report there instead of
//     printing a table. The generator uses this to collect per-operation results.
import { writeFileSync } from 'node:fs';

// The package exports the client class. The client reads auth and the base URL from the
// environment, so it needs no constructor options to point at a server.
import ArinaDocumentIntelligenceAPI from '@arina-ai/arina-grid-di';

// One shared client runs every case.
const client = new ArinaDocumentIntelligenceAPI({ maxRetries: 2, timeout: 10_000 });

// The result of running one case, collected for the JSON report or the printed table.
type SmokeResult = {
  operation: string;
  method: string;
  path: string;
  label?: string;
  status: 'passed' | 'failed';
  durationMs: number;
  error?: string;
};

// One or two entries per generated operation: the first passes only the arguments the method
// requires, the second also fills every optional parameter and body property. `label` says which
// is which, and is absent when the operation has no optional argument and so has only one case.
// `run` performs the real SDK call; the other fields are metadata used for filtering and
// reporting. This list is generated, so it stays in sync with the SDK surface.
const cases: {
  operation: string;
  method: string;
  path: string;
  label?: string;
  run: () => Promise<unknown>;
}[] = [
  {
    operation: 'createExtractRun',
    method: 'POST',
    path: '/extract_runs',
    label: 'required params',
    run: async () => {
      const extractRun = await client.extraction.createExtractRun({
        file: new File(['file'], 'file'),
        config:
          '{"organizationId": "org_123", "config": {"jsonSchema": {"type": "object", "properties": {"invoiceNumber": {"type": ["string", "null"]}, "invoiceTotal": {"type": ["number", "null"], "description": "Total amount due"}}}, "citationsEnabled": true}}',
      });
    },
  },

  {
    operation: 'createExtractRun',
    method: 'POST',
    path: '/extract_runs',
    label: 'all params',
    run: async () => {
      const extractRun = await client.extraction.createExtractRun({
        'X-Api-Version': '2026-09-05',
        file: new File(['file'], 'file'),
        config:
          '{"organizationId": "org_123", "config": {"jsonSchema": {"type": "object", "properties": {"invoiceNumber": {"type": ["string", "null"]}, "invoiceTotal": {"type": ["number", "null"], "description": "Total amount due"}}}, "citationsEnabled": true}}',
      });
    },
  },

  {
    operation: 'retrieveExtractRun',
    method: 'GET',
    path: '/extract_runs/{run_id}',
    label: 'required params',
    run: async () => {
      const extractRun = await client.extraction.retrieveExtractRun('runId');
    },
  },

  {
    operation: 'retrieveExtractRun',
    method: 'GET',
    path: '/extract_runs/{run_id}',
    label: 'all params',
    run: async () => {
      const extractRun = await client.extraction.retrieveExtractRun('runId', {
        'X-Api-Version': '2026-09-05',
      });
    },
  },

  {
    operation: 'listExtractRunPage',
    method: 'GET',
    path: '/extract_runs/{run_id}/page',
    label: 'required params',
    run: async () => {
      const response = await client.extraction.listExtractRunPage('runId');
    },
  },

  {
    operation: 'listExtractRunPage',
    method: 'GET',
    path: '/extract_runs/{run_id}/page',
    label: 'all params',
    run: async () => {
      const response = await client.extraction.listExtractRunPage('runId', {
        'X-Api-Version': '2026-09-05',
      });
    },
  },

  {
    operation: 'createRun',
    method: 'POST',
    path: '/parse_runs',
    label: 'required params',
    run: async () => {
      const parseRun = await client.parse.createRun({
        file: new File(['file'], 'file'),
        config: '{"organizationId": "org_123", "config": {"includeTextLines": false}}',
      });
    },
  },

  {
    operation: 'createRun',
    method: 'POST',
    path: '/parse_runs',
    label: 'all params',
    run: async () => {
      const parseRun = await client.parse.createRun({
        'X-Api-Version': '2026-09-05',
        file: new File(['file'], 'file'),
        config: '{"organizationId": "org_123", "config": {"includeTextLines": false}}',
      });
    },
  },

  {
    operation: 'retrieveRun',
    method: 'GET',
    path: '/parse_runs/{run_id}',
    label: 'required params',
    run: async () => {
      const parseRun = await client.parse.retrieveRun('runId');
    },
  },

  {
    operation: 'retrieveRun',
    method: 'GET',
    path: '/parse_runs/{run_id}',
    label: 'all params',
    run: async () => {
      const parseRun = await client.parse.retrieveRun('runId', {
        'X-Api-Version': '2026-09-05',
      });
    },
  },

  {
    operation: 'listRunPage',
    method: 'GET',
    path: '/parse_runs/{run_id}/page',
    label: 'required params',
    run: async () => {
      const response = await client.parse.listRunPage('runId');
    },
  },

  {
    operation: 'listRunPage',
    method: 'GET',
    path: '/parse_runs/{run_id}/page',
    label: 'all params',
    run: async () => {
      const response = await client.parse.listRunPage('runId', {
        'X-Api-Version': '2026-09-05',
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/extractors',
    label: 'required params',
    run: async () => {
      const extractor = await client.extractors.create({
        organizationId: 'org_123',
        name: 'Invoice — EU vendors',
        description: null,
        config: {
          jsonSchema: { type: 'object', properties: { invoiceTotal: { type: ['number', 'null'] } } },
          citationsEnabled: true,
        },
        metadata: null,
      });
    },
  },

  {
    operation: 'create',
    method: 'POST',
    path: '/extractors',
    label: 'all params',
    run: async () => {
      const extractor = await client.extractors.create({
        'X-Api-Version': '2026-09-05',
        organizationId: 'org_123',
        name: 'Invoice — EU vendors',
        description: null,
        config: {
          jsonSchema: { type: 'object', properties: { invoiceTotal: { type: ['number', 'null'] } } },
          citationsEnabled: true,
        },
        metadata: null,
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/extractors',
    label: 'required params',
    run: async () => {
      const extractorList = await client.extractors.list({
        organizationId: 'organizationId',
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/extractors',
    label: 'all params',
    run: async () => {
      const extractorList = await client.extractors.list({
        organizationId: 'organizationId',
        status: 'ACTIVE',
        'X-Api-Version': '2026-09-05',
      });
    },
  },

  {
    operation: 'retrieve',
    method: 'GET',
    path: '/extractors/{extractor_id}',
    label: 'required params',
    run: async () => {
      const extractor = await client.extractors.retrieve('extractorId', {
        organizationId: 'organizationId',
      });
    },
  },

  {
    operation: 'retrieve',
    method: 'GET',
    path: '/extractors/{extractor_id}',
    label: 'all params',
    run: async () => {
      const extractor = await client.extractors.retrieve('extractorId', {
        organizationId: 'organizationId',
        'X-Api-Version': '2026-09-05',
      });
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/extractors/{extractor_id}',
    label: 'required params',
    run: async () => {
      const extractor = await client.extractors.update('extractorId', {
        organizationId: 'x',
        name: null,
        description: null,
        config: null,
        metadata: null,
        version: null,
      });
    },
  },

  {
    operation: 'update',
    method: 'PATCH',
    path: '/extractors/{extractor_id}',
    label: 'all params',
    run: async () => {
      const extractor = await client.extractors.update('extractorId', {
        'X-Api-Version': '2026-09-05',
        organizationId: 'x',
        name: null,
        description: null,
        config: null,
        metadata: null,
        version: null,
      });
    },
  },

  {
    operation: 'delete',
    method: 'DELETE',
    path: '/extractors/{extractor_id}',
    label: 'required params',
    run: async () => {
      const extractor = await client.extractors.delete('extractorId', {
        organizationId: 'organizationId',
        permanent: false,
      });
    },
  },

  {
    operation: 'delete',
    method: 'DELETE',
    path: '/extractors/{extractor_id}',
    label: 'all params',
    run: async () => {
      const extractor = await client.extractors.delete('extractorId', {
        organizationId: 'organizationId',
        permanent: false,
        'X-Api-Version': '2026-09-05',
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/extractors/{extractor_id}/versions',
    label: 'required params',
    run: async () => {
      const extractorVersionList = await client.extractors.versions.list('extractorId', {
        organizationId: 'organizationId',
      });
    },
  },

  {
    operation: 'list',
    method: 'GET',
    path: '/extractors/{extractor_id}/versions',
    label: 'all params',
    run: async () => {
      const extractorVersionList = await client.extractors.versions.list('extractorId', {
        organizationId: 'organizationId',
        'X-Api-Version': '2026-09-05',
      });
    },
  },

  {
    operation: 'retrieve',
    method: 'GET',
    path: '/extractors/{extractor_id}/versions/{version}',
    label: 'required params',
    run: async () => {
      const extractorVersion = await client.extractors.versions.retrieve(1, {
        extractor_id: 'extractorId',
        organizationId: 'organizationId',
      });
    },
  },

  {
    operation: 'retrieve',
    method: 'GET',
    path: '/extractors/{extractor_id}/versions/{version}',
    label: 'all params',
    run: async () => {
      const extractorVersion = await client.extractors.versions.retrieve(1, {
        extractor_id: 'extractorId',
        organizationId: 'organizationId',
        'X-Api-Version': '2026-09-05',
      });
    },
  },
];

/**
 * How many cases run at once, capped at the number of cases there are.
 *
 * SCALAR_SMOKE_CONCURRENCY overrides the default; anything unparseable falls back to it.
 */
const smokeConcurrency = (caseCount: number): number => {
  const override = Number.parseInt(process.env['SCALAR_SMOKE_CONCURRENCY'] ?? '', 10);
  const limit = Number.isInteger(override) && override > 0 ? override : 32;
  return Math.min(limit, caseCount);
};

const main = async (): Promise<void> => {
  // SCALAR_SMOKE_FILTER (comma-separated) keeps only cases whose operation name or path matches
  // one of the needles, so a caller can smoke-test a subset. With no filter, every case runs.
  const filter = process.env['SCALAR_SMOKE_FILTER'];
  const needles = filter
    ? filter
        .split(',')
        .map((needle) => needle.trim())
        .filter(Boolean)
    : [];
  const selected =
    needles.length > 0
      ? cases.filter((testCase) =>
          needles.some((needle) => testCase.operation.includes(needle) || testCase.path.includes(needle)),
        )
      : cases;

  // Run the selected cases under a bounded worker pool rather than all at once. A large SDK has
  // hundreds of operations, and firing every request together exceeds what the client's transport
  // keeps connections for while the runner is already busy with other targets. Each worker pulls
  // the next index off a shared cursor and writes into a pre-sized array, so results stay in case
  // order however the workers interleave. The per-case body catches everything and never rejects,
  // so one failing operation still cannot block the others.
  const results: SmokeResult[] = new Array<SmokeResult>(selected.length);
  let cursor = 0;
  const runNext = async (): Promise<void> => {
    for (let index = cursor++; index < selected.length; index = cursor++) {
      const testCase = selected[index];
      if (!testCase) continue;
      const startedAt = Date.now();
      // `label` distinguishes the required-params run from the all-params run of the same
      // operation; it is omitted entirely when the operation contributed only one case.
      const identity = {
        operation: testCase.operation,
        method: testCase.method,
        path: testCase.path,
        ...(testCase.label ? { label: testCase.label } : {}),
      };
      try {
        await testCase.run();
        results[index] = { ...identity, status: 'passed', durationMs: Date.now() - startedAt };
      } catch (error) {
        // Prefer the stack so a failure points at the failing SDK call; fall back to the message.
        const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
        results[index] = {
          ...identity,
          status: 'failed',
          durationMs: Date.now() - startedAt,
          error: message,
        };
      }
    }
  };
  await Promise.all(Array.from({ length: smokeConcurrency(selected.length) }, runNext));
  const failed = results.filter((result) => result.status === 'failed');

  // With SCALAR_SMOKE_REPORT set, write a machine-readable report; otherwise print a table.
  const reportPath = process.env['SCALAR_SMOKE_REPORT'];
  if (reportPath) {
    writeFileSync(reportPath, JSON.stringify({ total: results.length, failed: failed.length, results }));
  } else {
    for (const result of results) {
      const suffix = result.label ? ` [${result.label}]` : '';
      if (result.status === 'passed')
        console.log(
          `\u2714 ${result.operation}${suffix} (${result.method} ${result.path}) ${result.durationMs}ms`,
        );
      else
        console.error(
          `\u2718 ${result.operation}${suffix} (${result.method} ${result.path})\n${result.error ?? ''}`,
        );
    }
    if (results.length === 0) {
      console.error('No code samples ran (empty SDK or a SCALAR_SMOKE_FILTER that matched nothing).');
    } else {
      console.log(`\n${results.length - failed.length}/${results.length} samples passed`);
    }
  }

  // An empty run (no operations, or a filter that matched nothing) is a failure, not a vacuous pass.
  if (failed.length > 0 || results.length === 0) process.exitCode = 1;
};

void main();
