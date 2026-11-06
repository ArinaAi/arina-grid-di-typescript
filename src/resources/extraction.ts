// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { buildHeaders } from '../internal/headers';
import { multipartFormRequestOptions } from '../internal/uploads';
import { path as __scalarPath } from '../internal/utils/path';
import type { Uploadable } from '../core/uploads';

export class Extraction extends APIResource {
  /**
   * Accept a document and return a run to poll. `config.config` is either an inline `jsonSchema`/`extractionRules`, or an `extractorId` (optionally with `extractorVersion`) naming a saved extractor. `202`: accepted, not complete — poll `GET /extract_runs/{id}`.
   *
   * @param {ExtractionCreateExtractRunParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ExtractRun>} Run accepted.
   *
   * @example
   * ```ts
   * const extractRun = await client.extraction.createExtractRun({
   *   file: new File(['file'], 'file'),
   *   config:
   *     '{"config": {"jsonSchema": {"type": "object", "properties": {"invoiceNumber": {"type": ["string", "null"]}, "invoiceTotal": {"type": ["number", "null"], "description": "Total amount due"}}}, "citationsEnabled": true}}',
   * });
   * ```
   */
  createExtractRun(
    params: ExtractionCreateExtractRunParams,
    options?: RequestOptions,
  ): APIPromise<ExtractRun> {
    const { 'X-Api-Version': xAPIVersion, ...body } = params;
    return this._client.post(
      '/extract_runs',
      multipartFormRequestOptions(
        {
          body,
          ...options,
          headers: buildHeaders([
            { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
            options?.headers,
          ]),
        },
        this._client,
      ),
    );
  }

  /**
   * Report a run's status, and its output with citations once finished.
   *
   * @param {string} runID
   * @param {ExtractionRetrieveExtractRunParams} [params] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ExtractRun>} The run.
   *
   * @example
   * ```ts
   * const extractRun = await client.extraction.retrieveExtractRun('runId');
   * ```
   */
  retrieveExtractRun(
    runID: string,
    params: ExtractionRetrieveExtractRunParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<ExtractRun> {
    const { 'X-Api-Version': xAPIVersion } = params ?? {};
    return this._client.get(__scalarPath`/extract_runs/${runID}`, {
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }

  /**
   * Serve the page image a run's citation polygons were measured against.
   *
   * @param {string} runID
   * @param {ExtractionListExtractRunPageParams} [params] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<Response>} The rendered page image (JPEG). Overlay polygons are in its frame.
   *
   * @example
   * ```ts
   * const response = await client.extraction.listExtractRunPage('runId');
   * ```
   */
  listExtractRunPage(
    runID: string,
    params: ExtractionListExtractRunPageParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Response> {
    const { 'X-Api-Version': xAPIVersion } = params ?? {};
    return this._client.get(__scalarPath`/extract_runs/${runID}/page`, {
      ...options,
      headers: buildHeaders([
        { Accept: 'image/jpeg', ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
      __binaryResponse: true,
    });
  }

  /**
   * Accept up to 100 documents under one `config` and return a batch to poll. Each document becomes an ordinary extraction run, listed in `items` with its run id; results are read from the runs. The request is checked whole: one file of the wrong type or size refuses all of it, naming the files. Available where queued execution is enabled.
   *
   * @param {ExtractionCreateExtractBatchParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RunBatch>} Batch accepted. Every document the service could take in is now a queued run, named in `items`; one it could not is an item with `runId: null` and `status: FAILED`.
   *
   * @example
   * ```ts
   * const runBatch = await client.extraction.createExtractBatch({
   *   files: [new File(['file'], 'file')],
   *   config:
   *     '{"config": {"jsonSchema": {"type": "object", "properties": {"invoiceNumber": {"type": ["string", "null"]}, "invoiceTotal": {"type": ["number", "null"], "description": "Total amount due"}}}, "citationsEnabled": true}}',
   * });
   * ```
   */
  createExtractBatch(
    params: ExtractionCreateExtractBatchParams,
    options?: RequestOptions,
  ): APIPromise<RunBatch> {
    const { 'X-Api-Version': xAPIVersion, ...body } = params;
    return this._client.post(
      '/extract_runs/batches',
      multipartFormRequestOptions(
        {
          body,
          ...options,
          headers: buildHeaders([
            { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
            options?.headers,
          ]),
        },
        this._client,
      ),
    );
  }

  /**
   * Report a batch's progress: `status`, `counts`, and each document's run and state. Poll this instead of every run; when `status` is `COMPLETED`, read the results from `GET /extract_runs/{id}` for the items you want.
   *
   * @param {string} batchID
   * @param {ExtractionRetrieveExtractBatchParams} [params] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<RunBatch>} The batch as it stands now: each item's `status` is its run's, `counts` add them up, `updatedAt` is the latest change among the runs. Not cacheable.
   *
   * @example
   * ```ts
   * const runBatch = await client.extraction.retrieveExtractBatch('batchId');
   * ```
   */
  retrieveExtractBatch(
    batchID: string,
    params: ExtractionRetrieveExtractBatchParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<RunBatch> {
    const { 'X-Api-Version': xAPIVersion } = params ?? {};
    return this._client.get(__scalarPath`/extract_runs/batches/${batchID}`, {
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }
}

/**
 * An extraction run. See :class:`RunEnvelope` for the envelope and status rules.
 */
export interface ExtractRun {
  /**
   * Run identifier, prefixed 'exr_'
   */
  id: string;
  /**
   * See RunStatus; treat as an open string
   */
  status: string;
  uploadId: string;
  /**
   * Extraction parameters for one run.
   *
   * Requires ``jsonSchema``, ``extractionRules``, or both, unless ``extractorId``
   * names a saved extractor, whose configuration is resolved into these fields when
   * the run is created. Neither is rejected rather than inferring a schema the
   * caller cannot inspect.
   */
  config: ExtractConfig;
  /**
   * RFC 3339 UTC
   */
  createdAt: string;
  /**
   * RFC 3339 UTC
   */
  updatedAt: string;
  /**
   * @default extract_run
   */
  object?: string;
  /**
   * Wire contract version that produced this run (date-based)
   * @default 2026-09-05
   */
  apiVersion?: string;
  /**
   * @default null
   */
  documentName?: string | null;
  /**
   * @default null
   */
  organizationId?: string | null;
  /**
   * @default null
   */
  collection?: string | null;
  /**
   * The batch this run was submitted in, if any ('pbt_…')
   * @default null
   */
  batchId?: string | null;
  /**
   * The extracted data, and per-field provenance for it.
   * @default null
   */
  output?: ExtractOutput | null;
  /**
   * See FailureReason; treat as an open string
   * @default null
   */
  failureReason?: string | null;
  /**
   * Human-readable detail; never the only signal
   * @default null
   */
  failureMessage?: string | null;
  /**
   * @default null
   */
  metadata?: Record<string, unknown> | null;
}

/**
 * A batch of runs. ``object`` names the kind: ``parse_batch`` or ``extract_batch``.
 *
 * ``status`` and ``counts`` are what they were when the record was written or last
 * refreshed; a route serves a batch through ``refresh`` so a caller sees them live.
 * The member runs' outputs stay on the runs.
 */
export interface RunBatch {
  /**
   * 'parse_batch' or 'extract_batch'
   */
  object: string;
  /**
   * Batch identifier, prefixed 'pbt_'
   */
  id: string;
  /**
   * RFC 3339 UTC
   */
  createdAt: string;
  /**
   * RFC 3339 UTC; the latest change among the member runs
   */
  updatedAt: string;
  /**
   * Wire contract version that produced this batch (date-based)
   * @default 2026-09-05
   */
  apiVersion?: string;
  /**
   * See BatchStatus; treat as an open string
   * @default PENDING
   */
  status?: string;
  /**
   * How many items are in each state. ``total`` is the sum of the others.
   */
  counts?: BatchCounts;
  items?: Array<BatchItem>;
  /**
   * @default null
   */
  organizationId?: string | null;
  /**
   * The configuration every member run was made with
   * @default null
   */
  config?: unknown;
  /**
   * @default null
   */
  metadata?: Record<string, unknown> | null;
}

/**
 * Extraction parameters for one run.
 *
 * Requires ``jsonSchema``, ``extractionRules``, or both, unless ``extractorId``
 * names a saved extractor, whose configuration is resolved into these fields when
 * the run is created. Neither is rejected rather than inferring a schema the
 * caller cannot inspect.
 */
export interface ExtractConfig {
  /**
   * Saved extractor to take the configuration from
   * @default null
   */
  extractorId?: string | null;
  /**
   * Extractor version to use; on a run, the version actually used. Absent on the request means the current version.
   * @default null
   * @minimum 1
   */
  extractorVersion?: number | null;
  /**
   * JSON Schema describing the fields to extract. Supported subset: an object at the root; types string, number, integer, boolean, object, array; primitives must admit null (e.g. ["number", "null"]); array items are objects; enums include null; nesting at most 3 levels; property names [A-Za-z0-9_-]; at most 200 fields.
   * @default null
   */
  jsonSchema?: Record<string, unknown> | null;
  /**
   * Natural-language guidance, e.g. 'amounts are in USD; treat a dash as zero'. Applied in addition to the schema.
   * @default null
   * @maxLength 8000
   */
  extractionRules?: string | null;
  /**
   * Locate each value on the page and return its geometry
   * @default true
   */
  citationsEnabled?: boolean;
  /**
   * Granularity of citation geometry. Only 'block' is served today; 'cell', 'line' and 'word' are declared but rejected until the upstream geometry they need is enabled.
   * @default block
   */
  citationMode?: string;
  /**
   * Processing tier. 'standard' is the default; 'premium' uses a larger model for higher field accuracy at higher latency and cost. On a run from a saved extractor, an explicit value overrides the extractor's.
   * @default standard
   */
  tier?: string;
}

/**
 * The extracted data, and per-field provenance for it.
 */
export interface ExtractOutput {
  /**
   * Extracted data, conforming to the requested jsonSchema
   */
  value: Record<string, unknown>;
  /**
   * Keyed by field path into `value` — see FIELD_PATH_GRAMMAR. A path may be absent when nothing was located for it.
   */
  metadata?: Record<string, FieldMetadata>;
  /**
   * The raster the citation polygons refer to. None if it could not be stored, in which case the extracted values remain valid but no overlay can be drawn.
   * @default null
   */
  pageImage?: PageImage | null;
}

/**
 * How many items are in each state. ``total`` is the sum of the others.
 */
export interface BatchCounts {
  /**
   * @default 0
   */
  total?: number;
  /**
   * @default 0
   */
  pending?: number;
  /**
   * @default 0
   */
  processing?: number;
  /**
   * @default 0
   */
  processed?: number;
  /**
   * @default 0
   */
  failed?: number;
}

/**
 * One document of the batch and the run it became.
 *
 * ``run_id`` is None when the infrastructure refused the document at accept
 * time (storage, record or publish). Such an item is FAILED from the start, and
 * the caller resubmits that document on its own.
 */
export interface BatchItem {
  documentName: string;
  /**
   * @default null
   */
  runId?: string | null;
  /**
   * See RunStatus; treat as an open string
   * @default PENDING
   */
  status?: string;
  /**
   * See FailureReason; treat as an open string
   * @default null
   */
  failureReason?: string | null;
  /**
   * @default null
   */
  failureMessage?: string | null;
}

/**
 * Per-field confidence and provenance, keyed by field path in the output.
 */
export interface FieldMetadata {
  /**
   * Text recognition confidence for the underlying span
   * @default null
   * @minimum 0
   * @maximum 1
   */
  ocrConfidence?: number | null;
  /**
   * Empty when the value could not be located on the page. Indicates absence of a position, not low confidence in the value.
   */
  citations?: Array<Citation>;
}

/**
 * The rendered page's coordinate frame. Fetch the image itself from `GET /{run}/page`; overlay polygons are in this width/height.
 */
export interface PageImage {
  /**
   * @exclusiveMinimum 0
   */
  width: number;
  /**
   * @exclusiveMinimum 0
   */
  height: number;
}

/**
 * Where in the document a value came from.
 */
export interface Citation {
  /**
   * The page a citation refers to, and the frame its coordinates use.
   */
  page: PageRef;
  /**
   * Region outline, clockwise from top-left. Four points for an axis-aligned region, or a quad when the page is skewed.
   * @minItems 3
   */
  polygon: Array<Point>;
  /**
   * The source text backing the value, when recoverable
   * @default null
   */
  referenceText?: string | null;
  /**
   * Block-detection confidence, 0–1. Diagnostic; not a field-level accuracy measure.
   * @default null
   * @minimum 0
   * @maximum 1
   */
  layoutScore?: number | null;
}

/**
 * The page a citation refers to, and the frame its coordinates use.
 */
export interface PageRef {
  /**
   * 1-based page number
   * @minimum 1
   */
  number: number;
  /**
   * Page width in the polygon's units
   * @exclusiveMinimum 0
   */
  width: number;
  /**
   * Page height in the polygon's units
   * @exclusiveMinimum 0
   */
  height: number;
}

/**
 * One vertex, in the coordinate space of its page.
 */
export interface Point {
  x: number;
  y: number;
}

export interface ExtractionCreateExtractRunParams {
  /**
   * Header param: Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
  /**
   * Body param: Document to process. PDF, PNG or JPEG. Page 1 only. Max 15 MB.
   * @format binary
   */
  file: Uploadable;
  /**
   * Body param: Extraction configuration: the `ExtractRunRequest` object, JSON-encoded into this single form field (e.g. `json.dumps(...)` / `JSON.stringify(...)`). See the `ExtractRunRequest` schema for the fields.
   */
  config: string;
}

export interface ExtractionRetrieveExtractRunParams {
  /**
   * Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}

export interface ExtractionListExtractRunPageParams {
  /**
   * Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}

export interface ExtractionCreateExtractBatchParams {
  /**
   * Header param: Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
  /**
   * Body param: Documents to process, one part per file under this name. PDF, PNG or JPEG; page 1 of each. Up to 100 files, 15 MB each, 90 MB per request.
   * @minItems 1
   * @maxItems 100
   */
  files: Array<Uploadable>;
  /**
   * Body param: Extraction configuration: the `ExtractRunRequest` object, JSON-encoded into this single form field (e.g. `json.dumps(...)` / `JSON.stringify(...)`). See the `ExtractRunRequest` schema for the fields. Applied to every document.
   */
  config: string;
}

export interface ExtractionRetrieveExtractBatchParams {
  /**
   * Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}
export declare namespace Extraction {
  export {
    type ExtractRun as ExtractRun,
    type RunBatch as RunBatch,
    type ExtractConfig as ExtractConfig,
    type ExtractOutput as ExtractOutput,
    type BatchCounts as BatchCounts,
    type BatchItem as BatchItem,
    type FieldMetadata as FieldMetadata,
    type PageImage as PageImage,
    type Citation as Citation,
    type PageRef as PageRef,
    type Point as Point,
    type ExtractionCreateExtractRunParams as ExtractionCreateExtractRunParams,
    type ExtractionRetrieveExtractRunParams as ExtractionRetrieveExtractRunParams,
    type ExtractionListExtractRunPageParams as ExtractionListExtractRunPageParams,
    type ExtractionCreateExtractBatchParams as ExtractionCreateExtractBatchParams,
    type ExtractionRetrieveExtractBatchParams as ExtractionRetrieveExtractBatchParams,
  };
}
