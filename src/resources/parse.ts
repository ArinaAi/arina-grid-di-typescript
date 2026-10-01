// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { buildHeaders } from '../internal/headers';
import { multipartFormRequestOptions } from '../internal/uploads';
import { path as __scalarPath } from '../internal/utils/path';
import type { Uploadable } from '../core/uploads';
import type * as ExtractionAPI from './extraction';

export class Parse extends APIResource {
  /**
   * Read page 1 into layout blocks, tables (HTML) and markdown — no schema. `202`: poll `GET /parse_runs/{id}`.
   *
   * @param {ParseCreateRunParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ParseRun>} Run accepted.
   *
   * @example
   * ```ts
   * const parseRun = await client.parse.createRun({
   *   file: new File(['file'], 'file'),
   *   config: '{"organizationId": "org_123", "config": {"includeTextLines": false}}',
   * });
   * ```
   */
  createRun(params: ParseCreateRunParams, options?: RequestOptions): APIPromise<ParseRun> {
    const { 'X-Api-Version': xAPIVersion, ...body } = params;
    return this._client.post(
      '/parse_runs',
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
   * Report a run's status, and its parsed output once finished.
   *
   * @param {string} runID
   * @param {ParseRetrieveRunParams} [params] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ParseRun>} The run.
   *
   * @example
   * ```ts
   * const parseRun = await client.parse.retrieveRun('runId');
   * ```
   */
  retrieveRun(
    runID: string,
    params: ParseRetrieveRunParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<ParseRun> {
    const { 'X-Api-Version': xAPIVersion } = params ?? {};
    return this._client.get(__scalarPath`/parse_runs/${runID}`, {
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }

  /**
   * Serve the page image the output polygons were measured against.
   *
   * @param {string} runID
   * @param {ParseListRunPageParams} [params] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<Response>} The rendered page image (JPEG). Overlay polygons are in its frame.
   *
   * @example
   * ```ts
   * const response = await client.parse.listRunPage('runId');
   * ```
   */
  listRunPage(
    runID: string,
    params: ParseListRunPageParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Response> {
    const { 'X-Api-Version': xAPIVersion } = params ?? {};
    return this._client.get(__scalarPath`/parse_runs/${runID}/page`, {
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
 * A parse run. See :class:`RunEnvelope` for the envelope and status rules.
 */
export interface ParseRun {
  /**
   * Run identifier, prefixed 'prs_'
   */
  id: string;
  /**
   * See RunStatus; treat as an open string
   */
  status: string;
  uploadId: string;
  /**
   * RFC 3339 UTC
   */
  createdAt: string;
  /**
   * RFC 3339 UTC
   */
  updatedAt: string;
  /**
   * @default parse_run
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
   * Options for a parse run. Every option has a default, so ``config`` may be omitted.
   */
  config?: ParseConfig;
  /**
   * The parsed page.
   * @default null
   */
  output?: ParseOutput | null;
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
 * Options for a parse run. Every option has a default, so ``config`` may be omitted.
 */
export interface ParseConfig {
  /**
   * Also return every text line with its polygon and score
   * @default false
   */
  includeTextLines?: boolean;
}

/**
 * The parsed page.
 */
export interface ParseOutput {
  /**
   * The page a citation refers to, and the frame its coordinates use.
   */
  page: ExtractionAPI.PageRef;
  markdown: string;
  blocks?: Array<Block>;
  tables?: Array<Table>;
  /**
   * Present only when config.includeTextLines was set
   * @default null
   */
  textLines?: Array<TextLine> | null;
  /**
   * The rendered page's coordinate frame. Fetch the image itself from `GET /{run}/page`; overlay polygons are in this width/height.
   * @default null
   */
  pageImage?: ExtractionAPI.PageImage | null;
}

/**
 * One layout region, in reading order.
 */
export interface Block {
  /**
   * Open string; see API_PARSE.md for values
   */
  type: string;
  /**
   * Raw block label from the parser.
   */
  label: string;
  content: string;
  /**
   * @minItems 3
   */
  polygon: Array<ExtractionAPI.Point>;
  /**
   * @minimum 0
   */
  readingOrder: number;
  /**
   * Block identifier.
   * @default null
   */
  id?: number | null;
  /**
   * @default null
   * @minimum 0
   * @maximum 1
   */
  layoutScore?: number | null;
}

/**
 * A table block's HTML.
 */
export interface Table {
  /**
   * @minItems 3
   */
  polygon: Array<ExtractionAPI.Point>;
  html: string;
  /**
   * @default null
   */
  blockId?: number | null;
}

/**
 * One text line.
 */
export interface TextLine {
  /**
   * @minItems 3
   */
  polygon: Array<ExtractionAPI.Point>;
  text: string;
  /**
   * @default null
   * @minimum 0
   * @maximum 1
   */
  score?: number | null;
}

export interface ParseCreateRunParams {
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
   * Body param: Parse configuration: the `ParseRunRequest` object, JSON-encoded into this single form field (e.g. `json.dumps(...)` / `JSON.stringify(...)`). See the `ParseRunRequest` schema for the fields.
   */
  config: string;
}

export interface ParseRetrieveRunParams {
  /**
   * Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}

export interface ParseListRunPageParams {
  /**
   * Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}
export declare namespace Parse {
  export {
    type ParseRun as ParseRun,
    type ParseConfig as ParseConfig,
    type ParseOutput as ParseOutput,
    type Block as Block,
    type Table as Table,
    type TextLine as TextLine,
    type ParseCreateRunParams as ParseCreateRunParams,
    type ParseRetrieveRunParams as ParseRetrieveRunParams,
    type ParseListRunPageParams as ParseListRunPageParams,
  };
}
