// Polling helpers in src/lib.
import { describe, expect, it } from 'vitest';
import { RunFailedError, RunTimeoutError, waitForExtractRun, waitForParseRun } from '../src/lib';
import { json, makeClient, runPayload } from './helpers';

const FAST = { intervalMs: 1, maxIntervalMs: 2 };

/** Answer successive polls with the given statuses; the last one repeats forever. */
function scripted(
  kind: 'extract_run' | 'parse_run',
  statuses: string[],
  lastOverrides: Record<string, unknown> = {},
) {
  let i = 0;
  return () => {
    const status = statuses[Math.min(i++, statuses.length - 1)];
    const overrides = status === statuses[statuses.length - 1] ? lastOverrides : {};
    return json(200, runPayload(kind, { status, ...overrides }));
  };
}

describe('waitForExtractRun', () => {
  it('returns when PROCESSED after several polls', async () => {
    const { client, requests } = makeClient(
      scripted('extract_run', ['PROCESSING', 'PROCESSING', 'PROCESSED'], {
        output: { value: { total: 42.5 }, metadata: {}, pageImage: null },
      }),
    );
    const run = await waitForExtractRun(client, 'run_1', { timeoutMs: 5_000, ...FAST });
    expect(run.status).toBe('PROCESSED');
    expect(run.output?.value).toEqual({ total: 42.5 });
    expect(requests).toHaveLength(3);
    expect(requests.every((r) => new URL(r.url).pathname === '/extract_runs/run_1')).toBe(true);
  });

  it('throws RunFailedError with the reason and the run attached', async () => {
    const { client } = makeClient(
      scripted('extract_run', ['PROCESSING', 'FAILED'], {
        failureReason: 'UNREADABLE',
        failureMessage: 'blank page',
      }),
    );
    const error = await waitForExtractRun(client, 'run_1', { timeoutMs: 5_000, ...FAST }).catch((e) => e);
    expect(error).toBeInstanceOf(RunFailedError);
    expect(error.run.status).toBe('FAILED');
    expect(error.message).toContain('UNREADABLE: blank page');
  });

  it('returns a failed run when asked not to throw', async () => {
    const { client } = makeClient(scripted('extract_run', ['CANCELLED']));
    const run = await waitForExtractRun(client, 'run_1', {
      timeoutMs: 5_000,
      raiseOnFailure: false,
      ...FAST,
    });
    expect(run.status).toBe('CANCELLED');
  });

  it('treats an unknown status as still running', async () => {
    const { client, requests } = makeClient(scripted('extract_run', ['QUEUED_SOMEWHERE_NEW', 'PROCESSED']));
    const run = await waitForExtractRun(client, 'run_1', { timeoutMs: 5_000, ...FAST });
    expect(run.status).toBe('PROCESSED');
    expect(requests).toHaveLength(2);
  });

  it('throws RunTimeoutError and reports the last status', async () => {
    const { client, requests } = makeClient(scripted('extract_run', ['PROCESSING']));
    const error = await waitForExtractRun(client, 'run_1', { timeoutMs: 20, ...FAST }).catch((e) => e);
    expect(error).toBeInstanceOf(RunTimeoutError);
    expect(error.run.status).toBe('PROCESSING');
    expect(error.timeoutMs).toBe(20);
    expect(requests.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects settings that would spin or never poll', async () => {
    const { client, requests } = makeClient(scripted('extract_run', ['PROCESSING']));
    await expect(waitForExtractRun(client, 'run_1', { timeoutMs: 0 })).rejects.toThrow(
      /timeoutMs must be > 0/,
    );
    await expect(waitForExtractRun(client, 'run_1', { intervalMs: 0 })).rejects.toThrow(
      /intervalMs must be > 0/,
    );
    expect(requests).toHaveLength(0);
  });

  it('an interval above maxIntervalMs disables backoff instead of failing', async () => {
    const { client, requests } = makeClient(scripted('extract_run', ['PROCESSING', 'PROCESSED']));
    const run = await waitForExtractRun(client, 'run_1', {
      timeoutMs: 5_000,
      intervalMs: 2,
      maxIntervalMs: 1,
    });
    expect(run.status).toBe('PROCESSED');
    expect(requests).toHaveLength(2);
  });

  it('rejects immediately on an already-aborted signal, without a request', async () => {
    const { client, requests } = makeClient(scripted('extract_run', ['PROCESSING']));
    const controller = new AbortController();
    controller.abort(new Error('already stopped'));
    await expect(
      waitForExtractRun(client, 'run_1', { timeoutMs: 5_000, signal: controller.signal }),
    ).rejects.toThrow('already stopped');
    expect(requests).toHaveLength(0);
  });

  it('can be aborted', async () => {
    const { client } = makeClient(scripted('extract_run', ['PROCESSING']));
    const controller = new AbortController();
    const pending = waitForExtractRun(client, 'run_1', {
      timeoutMs: 5_000,
      intervalMs: 50,
      signal: controller.signal,
    });
    controller.abort(new Error('stop'));
    await expect(pending).rejects.toThrow('stop');
  });
});

describe('waitForParseRun', () => {
  it('polls the parse endpoint', async () => {
    const { client, last } = makeClient(scripted('parse_run', ['PROCESSED']));
    const run = await waitForParseRun(client, 'run_1', { timeoutMs: 5_000, ...FAST });
    expect(run.status).toBe('PROCESSED');
    expect(new URL(last().url).pathname).toBe('/parse_runs/run_1');
  });
});
