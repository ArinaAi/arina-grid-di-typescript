// Hand-written: not touched by scripts/import_sdk.py.
//
// Many documents in one request: submit within the batch limits and wait for the batch to complete.
// A batch is a handle on a set of runs. Its `status` is COMPLETED once every member run is terminal;
// failures live in `counts.failed` and the FAILED items, never on the batch, so there is nothing to
// throw for. Results are read from the member runs.

import type { ArinaDocumentIntelligenceAPI } from '../client';
import type { Uploadable } from '../core/uploads';
import type { RunBatch } from '../resources/extraction';
import { type PollOptions, poll } from './polling';

/** The one status after which a batch no longer changes. */
export const BATCH_COMPLETED = 'COMPLETED';

/** The API's limits per request, checked here before anything is sent. */
export const MAX_BATCH_FILES = 100;
export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_BATCH_BYTES = 90 * 1024 * 1024;

/** What the batch endpoints take, by file suffix. */
export const DOCUMENT_TYPES: ReadonlySet<string> = new Set(['.pdf', '.png', '.jpg', '.jpeg']);

// A hundred documents take minutes, not seconds: poll less often and wait longer than for a run.
const DEFAULT_TIMEOUT_MS = 1_800_000;
const DEFAULT_INTERVAL_MS = 2_000;
const DEFAULT_MAX_INTERVAL_MS = 10_000;

/** A `File` (or anything the client can upload that knows its name and size). */
export type BatchDocument = Uploadable & { readonly name: string; readonly size: number };

/** A `ParseRunRequest` / `ExtractRunRequest` as a JSON string, or an object to encode. */
export type BatchConfig = string | Record<string, unknown>;

export interface BatchWaitOptions extends PollOptions {
  /** Called with the batch after every poll, for progress (`batch.counts`). */
  onPoll?: (batch: RunBatch) => void;
}

/** The batch did not complete within `timeoutMs`. Its runs keep going server-side. */
export class BatchTimeoutError extends Error {
  constructor(
    public readonly batch: RunBatch,
    public readonly timeoutMs: number,
  ) {
    const counts = batch.counts;
    const progress = counts
      ? ` (${(counts.processed ?? 0) + (counts.failed ?? 0)} of ${counts.total ?? 0} documents finished)`
      : '';
    super(
      `batch ${batch.id} still ${batch.status} after ${timeoutMs}ms${progress}; it keeps running server-side`,
    );
    this.name = 'BatchTimeoutError';
  }
}

// Waiting

function waitForBatch(fetchBatch: () => Promise<RunBatch>, options: BatchWaitOptions): Promise<RunBatch> {
  const { onPoll, ...timing } = options;
  const check = (batch: RunBatch): RunBatch | undefined => {
    onPoll?.(batch);
    return batch.status === BATCH_COMPLETED ? batch : undefined;
  };
  return poll(
    fetchBatch,
    {
      ...timing,
      timeoutMs: timing.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      intervalMs: timing.intervalMs ?? DEFAULT_INTERVAL_MS,
      maxIntervalMs: timing.maxIntervalMs ?? DEFAULT_MAX_INTERVAL_MS,
    },
    check,
    (batch, timeoutMs) => new BatchTimeoutError(batch, timeoutMs),
  );
}

/** Poll `GET /parse_runs/batches/{batchId}` until COMPLETED and return the batch. */
export function waitForParseBatch(
  client: ArinaDocumentIntelligenceAPI,
  batchId: string,
  options: BatchWaitOptions = {},
): Promise<RunBatch> {
  return waitForBatch(() => client.parse.retrieveBatch(batchId), options);
}

/** Poll `GET /extract_runs/batches/{batchId}` until COMPLETED and return the batch. */
export function waitForExtractBatch(
  client: ArinaDocumentIntelligenceAPI,
  batchId: string,
  options: BatchWaitOptions = {},
): Promise<RunBatch> {
  return waitForBatch(() => client.extraction.retrieveExtractBatch(batchId), options);
}

// Submitting

function suffixOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
}

const MB = 1024 * 1024;

/** The document's size, once it is known to be one the API takes. */
function check(document: BatchDocument): number {
  const suffix = suffixOf(document.name);
  if (!DOCUMENT_TYPES.has(suffix)) {
    throw new TypeError(
      `${document.name}: unsupported type '${suffix || '(no suffix)'}'; the API takes ${[...DOCUMENT_TYPES].join(', ')}`,
    );
  }
  if (document.size > MAX_FILE_BYTES) {
    throw new RangeError(
      `${document.name}: ${(document.size / MB).toFixed(1)} MB exceeds the ${MAX_FILE_BYTES / MB} MB limit per file`,
    );
  }
  return document.size;
}

/**
 * Group documents into requests that fit the API's limits, in the order given.
 *
 * Every document is checked before anything is sent, so a file the API would refuse costs no
 * upload: the error names it (`TypeError` for the type, `RangeError` for the size).
 */
export function planBatches<T extends BatchDocument>(documents: Iterable<T>): T[][] {
  const groups: T[][] = [];
  let current: T[] = [];
  let currentBytes = 0;
  for (const document of documents) {
    const size = check(document);
    if (current.length > 0 && (current.length === MAX_BATCH_FILES || currentBytes + size > MAX_BATCH_BYTES)) {
      groups.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(document);
    currentBytes += size;
  }
  if (current.length === 0) throw new RangeError('no documents to submit');
  groups.push(current);
  return groups;
}

function configJson(config: BatchConfig): string {
  return typeof config === 'string' ? config : JSON.stringify(config);
}

async function submitBatches(
  create: (files: BatchDocument[], config: string) => Promise<RunBatch>,
  documents: Iterable<BatchDocument>,
  config: BatchConfig,
): Promise<RunBatch[]> {
  const json = configJson(config);
  const batches: RunBatch[] = [];
  for (const group of planBatches(documents)) batches.push(await create(group, json));
  return batches;
}

/**
 * `POST /parse_runs/batches` once per group from {@link planBatches}; the batches, in order.
 *
 * `documents` are `File`s (in Node: `await toFile(fs.createReadStream(path), basename(path))`);
 * `config` is the `ParseRunRequest` as a JSON string or an object.
 */
export function submitParseBatches(
  client: ArinaDocumentIntelligenceAPI,
  documents: Iterable<BatchDocument>,
  config: BatchConfig,
): Promise<RunBatch[]> {
  return submitBatches((files, json) => client.parse.createBatch({ files, config: json }), documents, config);
}

/** `POST /extract_runs/batches` once per group; same arguments, `config` is the `ExtractRunRequest`. */
export function submitExtractBatches(
  client: ArinaDocumentIntelligenceAPI,
  documents: Iterable<BatchDocument>,
  config: BatchConfig,
): Promise<RunBatch[]> {
  return submitBatches(
    (files, json) => client.extraction.createExtractBatch({ files, config: json }),
    documents,
    config,
  );
}
