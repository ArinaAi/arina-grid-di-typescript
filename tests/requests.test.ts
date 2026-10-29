// Wire contract: what the SDK sends must be what the API's routes parse.
// Key cases: `config` is ONE multipart form field holding JSON (the server reads `config: str = Form(...)`),
// and the API key is the tenant, so no request names an organisation.
import { afterEach, describe, expect, it } from 'vitest';
import ArinaDocumentIntelligenceAPI, {
  ArinaDocumentIntelligenceAPIError,
  AuthenticationError,
  NotFoundError,
  PermissionDeniedError,
  UnprocessableEntityError,
} from '../src/index';
import { API_KEY, json, makeClient, runPayload } from './helpers';

const EXTRACT_CONFIG = {
  config: {
    jsonSchema: { type: 'object', properties: { invoiceTotal: { type: ['number', 'null'] } } },
    citationsEnabled: true,
  },
  metadata: null,
};

const EXTRACTOR = {
  object: 'extractor',
  id: 'ext_1',
  organizationId: 'org_123', // reported by the server; never sent by the client
  name: 'Invoices',
  description: null,
  version: 1,
  status: 'ACTIVE',
  config: { citationsEnabled: true, citationMode: 'block' },
  metadata: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const IDENTITY = {
  organization: { id: 'org_123', slug: 'acme' },
  subject: 'key:k_abc',
  scopes: ['extract', 'parse', 'extractors:read', 'extractors:write'],
  keyId: 'k_abc',
  user: null,
};

const accepted = (kind: 'extract_run' | 'parse_run') => () => json(202, runPayload(kind));
const ok = (payload: unknown) => () => json(200, payload);

describe('multipart runs', () => {
  it('POST /extract_runs sends config as a single JSON form field next to the file', async () => {
    const { client, last } = makeClient(accepted('extract_run'));

    const run = await client.extraction.createExtractRun({
      file: new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'invoice.pdf', { type: 'application/pdf' }),
      config: JSON.stringify(EXTRACT_CONFIG),
    });

    const request = last();
    expect(request.method).toBe('POST');
    expect(new URL(request.url).pathname).toBe('/extract_runs');
    expect(request.headers.get('content-type')).toMatch(/^multipart\/form-data/);

    const form = await request.formData();
    expect([...form.keys()].sort()).toEqual(['config', 'file']);
    expect(JSON.parse(form.get('config') as string)).toEqual(EXTRACT_CONFIG);
    const file = form.get('file') as File;
    expect(file).toBeInstanceOf(File);
    expect([file.name, file.type, file.size]).toEqual(['invoice.pdf', 'application/pdf', 4]);

    expect(run.id).toBe('run_1');
    expect(run.status).toBe('PROCESSING');
  });

  it('POST /parse_runs sends the same shape', async () => {
    const { client, last } = makeClient(accepted('parse_run'));
    await client.parse.createRun({
      file: new File([new Uint8Array(8)], 'page.png', { type: 'image/png' }),
      config: JSON.stringify({ config: { includeTextLines: true } }),
    });
    const form = await last().formData();
    expect(new URL(last().url).pathname).toBe('/parse_runs');
    expect([...form.keys()].sort()).toEqual(['config', 'file']);
    expect(JSON.parse(form.get('config') as string).config.includeTextLines).toBe(true);
  });

  it('JSON null survives inside the config field', async () => {
    const { client, last } = makeClient(accepted('extract_run'));
    await client.extraction.createExtractRun({
      file: new File(['x'], 'x'),
      config: JSON.stringify({ config: {}, metadata: null }),
    });
    expect(JSON.parse((await last().formData()).get('config') as string).metadata).toBeNull();
  });

  it('a queued run is accepted as PENDING', async () => {
    const { client } = makeClient(() => json(202, runPayload('parse_run', { status: 'PENDING' })));
    const run = await client.parse.createRun({ file: new File(['x'], 'x'), config: '{}' });
    expect(run.status).toBe('PENDING');
  });
});

describe('headers', () => {
  it('sends X-API-Key on every request and nothing else as a credential', async () => {
    const { client, last } = makeClient(ok(runPayload()));
    await client.extraction.retrieveExtractRun('run_1');
    expect(last().headers.get('x-api-key')).toBe(API_KEY);
    expect(last().headers.get('authorization')).toBeNull();
  });

  it('sends X-Api-Version only when given', async () => {
    const { client, last } = makeClient(ok(runPayload()));
    await client.extraction.retrieveExtractRun('run_1');
    expect(last().headers.get('x-api-version')).toBeNull();
    // Typed param (the generated signature) and raw request header both work.
    await client.extraction.retrieveExtractRun('run_1', { 'X-Api-Version': '2026-09-05' });
    expect(last().headers.get('x-api-version')).toBe('2026-09-05');
    await client.extraction.retrieveExtractRun('run_1', null, { headers: { 'X-Api-Version': '2026-09-05' } });
    expect(last().headers.get('x-api-version')).toBe('2026-09-05');
  });

  it('page image is returned raw with its headers', async () => {
    const { client, last } = makeClient(
      () =>
        new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), {
          status: 200,
          headers: { 'content-type': 'image/jpeg', 'x-page-width': '1000', 'x-page-height': '1400' },
        }),
    );
    const response = await client.extraction.listExtractRunPage('run_1');
    expect(new URL(last().url).pathname).toBe('/extract_runs/run_1/page');
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect([bytes[0], bytes[1]]).toEqual([0xff, 0xd8]);
    expect(response.headers.get('x-page-width')).toBe('1000');
  });
});

describe('account', () => {
  it('whoAmI is a bare GET /me resolved from the key alone', async () => {
    const { client, last } = makeClient(ok(IDENTITY));
    const me = await client.account.whoAmI();
    expect(last().method).toBe('GET');
    expect(new URL(last().url).pathname).toBe('/me');
    expect(new URL(last().url).search).toBe('');
    expect(last().headers.get('x-api-key')).toBe(API_KEY);
    expect(me.organization).toEqual({ id: 'org_123', slug: 'acme' });
    expect([me.keyId, me.subject, me.user]).toEqual(['k_abc', 'key:k_abc', null]);
    expect(me.scopes).toEqual(IDENTITY.scopes);
  });

  it('withResponse exposes the raw Response next to the parsed identity', async () => {
    const { client } = makeClient(ok(IDENTITY));
    const { data, response } = await client.account.whoAmI().withResponse();
    expect(response.status).toBe(200);
    expect(data.keyId).toBe('k_abc');
  });
});

describe('JSON endpoints', () => {
  it('POST /extractors sends a camelCase JSON body with no organisation', async () => {
    const { client, last } = makeClient(() => json(201, EXTRACTOR));
    const extractor = await client.extractors.create({
      name: 'Invoices',
      config: { jsonSchema: { type: 'object' }, citationsEnabled: true },
    });
    expect(last().headers.get('content-type')).toBe('application/json');
    expect(await last().json()).toEqual({
      name: 'Invoices',
      config: { jsonSchema: { type: 'object' }, citationsEnabled: true },
    });
    expect(extractor.version).toBe(1);
    expect(extractor.organizationId).toBe('org_123'); // the server still reports the key's organisation
  });

  it('GET /extractors/{id} sends only the id', async () => {
    const { client, last } = makeClient(ok(EXTRACTOR));
    await client.extractors.retrieve('ext_1');
    const url = new URL(last().url);
    expect(url.pathname).toBe('/extractors/ext_1');
    expect(url.search).toBe('');
  });

  it('DELETE /extractors/{id}?permanent=true', async () => {
    const { client, last } = makeClient(ok({ object: 'extractor', id: 'ext_1', deleted: true }));
    await client.extractors.delete('ext_1', { permanent: true });
    expect(last().method).toBe('DELETE');
    expect([...new URL(last().url).searchParams.entries()]).toEqual([['permanent', 'true']]);
  });
});

describe('the key is the tenant', () => {
  it('no operation names an organisation in the URL or the body', async () => {
    const { client, requests } = makeClient((request) =>
      new URL(request.url).pathname === '/extractors' && request.method === 'GET'
        ? json(200, { object: 'list', data: [EXTRACTOR] })
        : json(200, EXTRACTOR),
    );
    await client.extractors.create({ name: 'n', config: { jsonSchema: { type: 'object' } } });
    await client.extractors.update('ext_1', { name: 'renamed', version: 1 });
    await client.extractors.retrieve('ext_1');
    await client.extractors.list({ status: 'all' });
    await client.extractors.versions.list('ext_1');
    await client.extractors.versions.retrieve(1, { extractor_id: 'ext_1' });

    expect(requests).toHaveLength(6);
    for (const request of requests) {
      expect(request.url.toLowerCase()).not.toContain('organization');
      expect(await request.text()).not.toContain('organization');
    }
  });
});

describe('errors', () => {
  it('401 -> AuthenticationError with the bare body', async () => {
    const { client } = makeClient(() => json(401, { detail: 'Unauthorized' }));
    const error = await client.account.whoAmI().catch((e) => e);
    expect(error).toBeInstanceOf(AuthenticationError);
    expect(error.status).toBe(401);
    expect(error.error).toEqual({ detail: 'Unauthorized' });
  });

  it('403 missing_scope -> PermissionDeniedError naming the scopes', async () => {
    const detail = {
      code: 'missing_scope',
      message: 'your credential lacks a scope this action needs',
      missing: ['extractors:write'],
    };
    const { client } = makeClient(() => json(403, { detail }));
    const error = await client.extractors.create({ name: 'n', config: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(PermissionDeniedError);
    expect(error.status).toBe(403);
    expect(error.error.detail.code).toBe('missing_scope');
    expect(error.error.detail.missing).toEqual(['extractors:write']);
  });

  it('404 -> NotFoundError with the JSON body', async () => {
    const { client } = makeClient(() => json(404, { detail: "Run 'x' not found. It may have expired." }));
    const error = await client.extraction.retrieveExtractRun('x').catch((e) => e);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.status).toBe(404);
    expect(error.error).toEqual({ detail: "Run 'x' not found. It may have expired." });
  });

  it('422 -> UnprocessableEntityError', async () => {
    const { client } = makeClient(() =>
      json(422, { detail: [{ loc: ['config'], msg: 'Value error, bad schema' }] }),
    );
    await expect(
      client.extraction.createExtractRun({ file: new File(['x'], 'x'), config: '{}' }),
    ).rejects.toBeInstanceOf(UnprocessableEntityError);
  });
});

describe('client construction', () => {
  const ENV = ['ARINA_GRID_API_KEY', 'API_KEY', 'ARINA_GRID_BASE_URL', 'ARINA_GRID_CUSTOM_HEADERS'] as const;
  const saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));
  afterEach(() => {
    for (const k of ENV) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('reads the credential from ARINA_GRID_API_KEY and nothing else', () => {
    process.env.ARINA_GRID_BASE_URL = 'https://di.example.test';
    process.env.API_KEY = 'must-not-be-read';
    delete process.env.ARINA_GRID_API_KEY;
    expect(() => new ArinaDocumentIntelligenceAPI()).toThrow(/ARINA_GRID_API_KEY/);
    process.env.ARINA_GRID_API_KEY = 'from-env';
    expect(new ArinaDocumentIntelligenceAPI().apiKey).toBe('from-env');
  });

  it('requires baseURL: no default host, nothing is sent', () => {
    delete process.env.ARINA_GRID_BASE_URL;
    expect(() => new ArinaDocumentIntelligenceAPI({ apiKey: 'k' })).toThrow(
      ArinaDocumentIntelligenceAPIError,
    );
    expect(() => new ArinaDocumentIntelligenceAPI({ apiKey: 'k' })).toThrow(/baseURL/);
  });

  it('reads baseURL from the environment', () => {
    process.env.ARINA_GRID_BASE_URL = 'https://di.example.test';
    const client = new ArinaDocumentIntelligenceAPI({ apiKey: 'k' });
    expect(client.baseURL.replace(/\/$/, '')).toBe('https://di.example.test');
  });

  it('adds ARINA_GRID_CUSTOM_HEADERS to every request', async () => {
    process.env.ARINA_GRID_CUSTOM_HEADERS = 'X-Trace: abc\nX-Team: billing';
    const { client, last } = makeClient(ok(IDENTITY));
    await client.account.whoAmI();
    expect([last().headers.get('x-trace'), last().headers.get('x-team')]).toEqual(['abc', 'billing']);
  });
});
