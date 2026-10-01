// Hand-written: not touched by scripts/import_sdk.py.
//
// Poll extraction and parse runs to a terminal status with backoff and a deadline.
// `status` is an open string in the contract: anything not in TERMINAL_STATUSES counts as running.

import type { ArinaDocumentIntelligenceAPI } from '../client';
import type { ExtractRun } from '../resources/extraction';
import type { ParseRun } from '../resources/parse';

/** Statuses after which a run no longer changes. */
export const TERMINAL_STATUSES: ReadonlySet<string> = new Set(['PROCESSED', 'FAILED', 'CANCELLED']);

export interface WaitOptions {
  /** Overall milliseconds before {@link RunTimeoutError}. Default 120_000. */
  timeoutMs?: number;
  /** First delay between polls; grows 1.5x per poll up to `maxIntervalMs`. Default 1_000. */
  intervalMs?: number;
  /** Cap on the delay between polls; raised to `intervalMs` if lower. Default 5_000. */
  maxIntervalMs?: number;
  /** Throw {@link RunFailedError} on FAILED/CANCELLED instead of returning the run. Default true. */
  raiseOnFailure?: boolean;
  /** Abort waiting early. */
  signal?: AbortSignal;
}

type Run = ExtractRun | ParseRun;

/** The run did not reach a terminal status within `timeoutMs`. It keeps running server-side. */
export class RunTimeoutError extends Error {
  constructor(
    public readonly run: Run,
    public readonly timeoutMs: number,
  ) {
    super(`run ${run.id} still ${run.status} after ${timeoutMs}ms; it keeps running server-side`);
    this.name = 'RunTimeoutError';
  }
}

/** The run finished as FAILED or CANCELLED. The run is on `.run`. */
export class RunFailedError extends Error {
  constructor(public readonly run: Run) {
    const detail = [run.failureReason, run.failureMessage].filter(Boolean).join(': ');
    super(`run ${run.id} ended ${run.status}${detail ? ` (${detail})` : ''}`);
    this.name = 'RunFailedError';
  }
}

const BACKOFF = 1.5;

function settings(options: WaitOptions) {
  const timeoutMs = options.timeoutMs ?? 120_000;
  const intervalMs = options.intervalMs ?? 1_000;
  if (!(timeoutMs > 0)) throw new RangeError(`timeoutMs must be > 0, got ${timeoutMs}`);
  if (!(intervalMs > 0)) throw new RangeError(`intervalMs must be > 0, got ${intervalMs}`);
  const maxIntervalMs = Math.max(options.maxIntervalMs ?? 5_000, intervalMs);
  return { timeoutMs, intervalMs, maxIntervalMs, raiseOnFailure: options.raiseOnFailure ?? true };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason ?? new Error('aborted'));
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error('aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function poll<R extends Run>(fetchRun: () => Promise<R>, options: WaitOptions): Promise<R> {
  const { timeoutMs, intervalMs, maxIntervalMs, raiseOnFailure } = settings(options);
  options.signal?.throwIfAborted(); // an already-aborted signal must not cost a request
  const deadline = Date.now() + timeoutMs;
  let delay = intervalMs;
  for (;;) {
    const run = await fetchRun();
    if (TERMINAL_STATUSES.has(run.status)) {
      if (run.status !== 'PROCESSED' && raiseOnFailure) throw new RunFailedError(run);
      return run;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new RunTimeoutError(run, timeoutMs);
    await sleep(Math.min(delay, remaining), options.signal);
    delay = Math.min(delay * BACKOFF, maxIntervalMs);
  }
}

/** Poll `GET /extract_runs/{runId}` until terminal and return the run. */
export function waitForExtractRun(
  client: ArinaDocumentIntelligenceAPI,
  runId: string,
  options: WaitOptions = {},
): Promise<ExtractRun> {
  return poll(() => client.extraction.retrieveExtractRun(runId), options);
}

/** Poll `GET /parse_runs/{runId}` until terminal and return the run. */
export function waitForParseRun(
  client: ArinaDocumentIntelligenceAPI,
  runId: string,
  options: WaitOptions = {},
): Promise<ParseRun> {
  return poll(() => client.parse.retrieveRun(runId), options);
}
