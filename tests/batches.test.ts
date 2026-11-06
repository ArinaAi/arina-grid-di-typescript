// Batch helpers in src/lib: waiting for a batch, planning and submitting documents.
import { describe, expect, it } from 'vitest';
import {
  type BatchDocument,
  BatchTimeoutError,
  planBatches,
  submitExtractBatches,
  submitParseBatches,
  waitForExtractBatch,
  waitForParseBatch,
} from '../src/lib';
import { batchPayload, json, makeClient } from './helpers';

const FAST = { intervalMs: 1, maxIntervalMs: 2 };
const DONE = { total: 2, pending: 0, processing: 0, processed: 1, failed: 1 };
const MB = 1024 * 1024;

/** Answer successive polls with the given statuses; the last one repeats forever. */
function scripted(
  kind: 'parse_batch' | 'extract_batch',
  statuses: string[],
  lastOverrides: Record<string, unknown> = {},
) {
  let i = 0;
  return () => {
    const status = statuses[Math.min(i++, statuses.length - 1)];
    const overrides = status === statuses[statuses.length - 1] ? lastOverrides : {};
    return json(200, batchPayload(kind, { status, ...overrides }));
  };
}

describe('waitForParseBatch / waitForExtractBatch', () => {
  it('returns when COMPLETED after several polls', async () => {
    const { client, requests } = makeClient(
      scripted('parse_batch', ['PENDING', 'PROCESSING', 'COMPLETED'], { counts: DONE }),
    );
    const batch = await waitForParseBatch(client, 'pbt_1', { timeoutMs: 5_000, ...FAST });
    expect(batch.status).toBe('COMPLETED');
    expect(batch.counts?.failed).toBe(1);
    expect(requests).toHaveLength(3);
    expect(requests.every((r) => new URL(r.url).pathname === '/parse_runs/batches/pbt_1')).toBe(true);
  });

  it('polls the extract endpoint for extract batches', async () => {
    const { client, last } = makeClient(scripted('extract_batch', ['COMPLETED']));
    const batch = await waitForExtractBatch(client, 'pbt_1', { timeoutMs: 5_000, ...FAST });
    expect(batch.object).toBe('extract_batch');
    expect(new URL(last().url).pathname).toBe('/extract_runs/batches/pbt_1');
  });

  it('a batch with failed documents is still COMPLETED: nothing is thrown', async () => {
    const { client } = makeClient(
      scripted('parse_batch', ['COMPLETED'], {
        counts: { total: 2, pending: 0, processing: 0, processed: 0, failed: 2 },
      }),
    );
    const batch = await waitForParseBatch(client, 'pbt_1', { timeoutMs: 5_000, ...FAST });
    expect(batch.counts?.failed).toBe(2);
  });

  it('throws BatchTimeoutError with the batch and its progress', async () => {
    const { client } = makeClient(scripted('parse_batch', ['PROCESSING']));
    const error = await waitForParseBatch(client, 'pbt_1', { timeoutMs: 10, ...FAST }).catch((e) => e);
    expect(error).toBeInstanceOf(BatchTimeoutError);
    expect(error.batch.status).toBe('PROCESSING');
    expect(error.timeoutMs).toBe(10);
    expect(error.message).toContain('1 of 2 documents finished');
  });

  it('treats an unknown status as still running', async () => {
    // `status` is an open string in the contract; a new value must not be mistaken for done.
    const { client, requests } = makeClient(scripted('parse_batch', ['PAUSED_SOMEWHERE_NEW', 'COMPLETED']));
    await waitForParseBatch(client, 'pbt_1', { timeoutMs: 5_000, ...FAST });
    expect(requests).toHaveLength(2);
  });

  it('calls onPoll after every poll, including the last', async () => {
    const { client } = makeClient(scripted('parse_batch', ['PENDING', 'PROCESSING', 'COMPLETED']));
    const seen: string[] = [];
    await waitForParseBatch(client, 'pbt_1', {
      timeoutMs: 5_000,
      ...FAST,
      onPoll: (b) => seen.push(b.status ?? ''),
    });
    expect(seen).toEqual(['PENDING', 'PROCESSING', 'COMPLETED']);
  });

  it('refuses invalid settings before any request', async () => {
    const { client, requests } = makeClient(scripted('parse_batch', ['COMPLETED']));
    await expect(waitForParseBatch(client, 'pbt_1', { timeoutMs: 0 })).rejects.toThrow(RangeError);
    expect(requests).toHaveLength(0);
  });

  it('an already-aborted signal costs no request', async () => {
    const { client, requests } = makeClient(scripted('parse_batch', ['COMPLETED']));
    const controller = new AbortController();
    controller.abort(new Error('stop'));
    await expect(waitForParseBatch(client, 'pbt_1', { signal: controller.signal })).rejects.toThrow('stop');
    expect(requests).toHaveLength(0);
  });
});

/** Planning reads only `name` and `size`, so a stand-in is enough to describe large files cheaply. */
const doc = (name: string, size = 4) => ({ name, size }) as unknown as BatchDocument;

describe('planBatches', () => {
  it('keeps the order given and takes PDF, PNG and JPEG in any case', () => {
    const docs = [doc('z.pdf'), doc('A.PNG'), doc('b.jpeg'), doc('c.JPG')];
    expect(planBatches(docs)).toEqual([docs]);
  });

  it('splits at 100 files', () => {
    const docs = Array.from({ length: 250 }, (_, i) => doc(`${i}.pdf`));
    const groups = planBatches(docs);
    expect(groups.map((g) => g.length)).toEqual([100, 100, 50]);
    expect(groups.flat()).toEqual(docs);
  });

  it('splits when the next file would exceed 90 MB together', () => {
    // seven files at the 15 MB per-file limit: six fit in 90 MB, the seventh starts a new request
    const docs = Array.from({ length: 7 }, (_, i) => doc(`${i}.pdf`, 15 * MB));
    expect(planBatches(docs)).toEqual([docs.slice(0, 6), docs.slice(6)]);
  });

  it('refuses a file over 15 MB by name', () => {
    expect(() => planBatches([doc('ok.pdf'), doc('big.pdf', 15 * MB + 1)])).toThrow(/big\.pdf.*15 MB/);
  });

  it('refuses an unsupported type by name', () => {
    expect(() => planBatches([doc('a.pdf'), doc('notes.txt')])).toThrow(TypeError);
    expect(() => planBatches([doc('noext')])).toThrow(/noext.*no suffix/);
  });

  it('refuses nothing to submit', () => {
    expect(() => planBatches([])).toThrow(/no documents/);
  });
});

/** Answer each POST with a fresh batch id, so the order of the returned batches can be checked. */
function accepted(kind: 'parse_batch' | 'extract_batch' = 'parse_batch') {
  let n = 0;
  return () => json(202, batchPayload(kind, { id: `pbt_${++n}`, status: 'PENDING' }));
}

const file = (name: string, type = 'application/pdf') => new File([`content of ${name}`], name, { type });

describe('submitParseBatches / submitExtractBatches', () => {
  it('sends one request per group with repeated bare `files` parts and the config', async () => {
    const { client, requests } = makeClient(accepted());
    const docs = Array.from({ length: 101 }, (_, i) => file(`${i}.pdf`));

    const batches = await submitParseBatches(client, docs, '{"config": {"includeTextLines": true}}');

    expect(batches.map((b) => b.id)).toEqual(['pbt_1', 'pbt_2']);
    expect(requests.map((r) => new URL(r.url).pathname)).toEqual([
      '/parse_runs/batches',
      '/parse_runs/batches',
    ]);
    const first = await requests[0]!.formData();
    expect(first.get('config')).toBe('{"config": {"includeTextLines": true}}');
    expect(first.getAll('files[]')).toHaveLength(0);
    const files = first.getAll('files') as File[];
    expect(files).toHaveLength(100);
    expect(files[0]?.name).toBe('0.pdf');
    expect(await files[0]?.text()).toBe('content of 0.pdf');
    const second = await requests[1]!.formData();
    expect((second.getAll('files') as File[]).map((f) => f.name)).toEqual(['100.pdf']);
  });

  it('JSON-encodes an object config', async () => {
    const { client, last } = makeClient(accepted());
    await submitParseBatches(client, [file('a.pdf')], {
      config: { includeTextLines: false },
      metadata: { job: 7 },
    });
    const form = await last().formData();
    expect(JSON.parse(form.get('config') as string)).toEqual({
      config: { includeTextLines: false },
      metadata: { job: 7 },
    });
  });

  it('extract batches post to the extract endpoint', async () => {
    const { client, last } = makeClient(accepted('extract_batch'));
    const [batch] = await submitExtractBatches(client, [file('a.png', 'image/png')], '{"config": {}}');
    expect(batch?.object).toBe('extract_batch');
    expect(new URL(last().url).pathname).toBe('/extract_runs/batches');
  });

  it('sends nothing when a document would be refused', async () => {
    const { client, requests } = makeClient(accepted());
    await expect(
      submitParseBatches(client, [file('a.pdf'), file('b.csv', 'text/csv')], '{}'),
    ).rejects.toThrow(/b\.csv/);
    expect(requests).toHaveLength(0);
  });
});
