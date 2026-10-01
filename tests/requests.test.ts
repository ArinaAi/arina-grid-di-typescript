// Wire contract: what the SDK sends must be what the API's routes parse.
// Key case: `config` is ONE multipart form field holding JSON (the server reads `config: str = Form(...)`).
import { describe, expect, it } from 'vitest';
import ArinaDocumentIntelligenceAPI, {
  ArinaDocumentIntelligenceAPIError,
  NotFoundError,
  UnprocessableEntityError,
} from '../src/index';
import { API_KEY, json, makeClient, runPayload } from './helpers';

const EXTRACT_CONFIG = {
  organizationId: 'org_123',
  config: {
    jsonSchema: { type: 'object', properties: { invoiceTotal: { type: ['number', 'null'] } } },
    citationsEnabled: true,
  },
  metadata: null,
};

const accepted = (kind: 'extract_run' | 'parse_run') => () => json(202, runPayload(kind));

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
      config: JSON.stringify({ organizationId: 'org_123', config: { includeTextLines: true } }),
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
      config: JSON.stringify({ organizationId: 'o', metadata: null }),
    });
    expect(JSON.parse((await last().formData()).get('config') as string).metadata).toBeNull();
  });
});

describe('headers', () => {
  it('sends X-API-Key on every request', async () => {
    const { client, last } = makeClient(() => json(200, runPayload()));
    await client.extraction.retrieveExtractRun('run_1');
    expect(last().headers.get('x-api-key')).toBe(API_KEY);
  });

  it('sends X-Api-Version only when given', async () => {
    const { client, last } = makeClient(() => json(200, runPayload()));
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

describe('JSON endpoints', () => {
  it('POST /extractors sends a camelCase JSON body', async () => {
    const { client, last } = makeClient(() =>
      json(201, {
        object: 'extractor',
        id: 'ext_1',
        organizationId: 'org_123',
        name: 'Invoices',
        version: 1,
        status: 'ACTIVE',
        config: { citationsEnabled: true, citationMode: 'block' },
        createdAt: 't',
        updatedAt: 't',
      }),
    );
    const extractor = await client.extractors.create({
      organizationId: 'org_123',
      name: 'Invoices',
      config: { jsonSchema: { type: 'object' }, citationsEnabled: true },
    });
    expect(last().headers.get('content-type')).toBe('application/json');
    expect(await last().json()).toEqual({
      organizationId: 'org_123',
      name: 'Invoices',
      config: { jsonSchema: { type: 'object' }, citationsEnabled: true },
    });
    expect(extractor.version).toBe(1);
  });

  it('GET /extractors/{id} puts organizationId in the query', async () => {
    const { client, last } = makeClient(() =>
      json(200, {
        id: 'ext_1',
        organizationId: 'org_123',
        name: 'n',
        version: 1,
        config: {},
        createdAt: 't',
        updatedAt: 't',
      }),
    );
    await client.extractors.retrieve('ext_1', { organizationId: 'org_123' });
    const url = new URL(last().url);
    expect(url.pathname).toBe('/extractors/ext_1');
    expect(url.searchParams.get('organizationId')).toBe('org_123');
  });

  it('DELETE /extractors/{id}?permanent=true', async () => {
    const { client, last } = makeClient(() => json(200, { object: 'extractor', id: 'ext_1', deleted: true }));
    await client.extractors.delete('ext_1', { organizationId: 'org_123', permanent: true });
    expect(last().method).toBe('DELETE');
    expect(new URL(last().url).searchParams.get('permanent')).toBe('true');
  });
});

describe('errors', () => {
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
  it('reads the credential from ARINA_GRID_API_KEY and nothing else', () => {
    const saved = {
      key: process.env.ARINA_GRID_API_KEY,
      generic: process.env.API_KEY,
      base: process.env.ARINA_GRID_BASE_URL,
    };
    process.env.ARINA_GRID_BASE_URL = 'https://di.example.test';
    process.env.API_KEY = 'must-not-be-read';
    delete process.env.ARINA_GRID_API_KEY;
    try {
      expect(() => new ArinaDocumentIntelligenceAPI()).toThrow(/ARINA_GRID_API_KEY/);
      process.env.ARINA_GRID_API_KEY = 'from-env';
      expect(new ArinaDocumentIntelligenceAPI().apiKey).toBe('from-env');
    } finally {
      for (const [k, v] of [
        ['ARINA_GRID_API_KEY', saved.key],
        ['API_KEY', saved.generic],
        ['ARINA_GRID_BASE_URL', saved.base],
      ] as const) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });

  it('requires baseURL: no default host, nothing is sent', async () => {
    const previous = process.env.ARINA_GRID_BASE_URL;
    delete process.env.ARINA_GRID_BASE_URL;
    try {
      expect(() => new ArinaDocumentIntelligenceAPI({ apiKey: 'k' })).toThrow(
        ArinaDocumentIntelligenceAPIError,
      );
      expect(() => new ArinaDocumentIntelligenceAPI({ apiKey: 'k' })).toThrow(/baseURL/);
    } finally {
      if (previous !== undefined) process.env.ARINA_GRID_BASE_URL = previous;
    }
  });

  it('reads baseURL from the environment', () => {
    const previous = process.env.ARINA_GRID_BASE_URL;
    process.env.ARINA_GRID_BASE_URL = 'https://di.example.test';
    try {
      const client = new ArinaDocumentIntelligenceAPI({ apiKey: 'k' });
      expect(client.baseURL.replace(/\/$/, '')).toBe('https://di.example.test');
    } finally {
      if (previous === undefined) delete process.env.ARINA_GRID_BASE_URL;
      else process.env.ARINA_GRID_BASE_URL = previous;
    }
  });
});
