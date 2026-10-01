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
   *     '{"organizationId": "org_123", "config": {"jsonSchema": {"type": "object", "properties": {"invoiceNumber": {"type": ["string", "null"]}, "invoiceTotal": {"type": ["number", "null"], "description": "Total amount due"}}}, "citationsEnabled": true}}',
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
export declare namespace Extraction {
  export {
    type ExtractRun as ExtractRun,
    type ExtractConfig as ExtractConfig,
    type ExtractOutput as ExtractOutput,
    type FieldMetadata as FieldMetadata,
    type PageImage as PageImage,
    type Citation as Citation,
    type PageRef as PageRef,
    type Point as Point,
    type ExtractionCreateExtractRunParams as ExtractionCreateExtractRunParams,
    type ExtractionRetrieveExtractRunParams as ExtractionRetrieveExtractRunParams,
    type ExtractionListExtractRunPageParams as ExtractionListExtractRunPageParams,
  };
}
