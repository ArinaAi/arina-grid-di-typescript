// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../../resource';
import { APIPromise } from '../../api-promise';
import type { RequestOptions } from '../../internal/request-options';
import { buildHeaders } from '../../internal/headers';
import { path as __scalarPath } from '../../internal/utils/path';
import type * as ExtractionAPI from '../extraction';

export class Versions extends APIResource {
  /**
   * Every immutable config snapshot, newest first.
   *
   * @param {string} extractorID
   * @param {VersionListParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ExtractorVersionList>} The versions, newest first.
   *
   * @example
   * ```ts
   * const extractorVersionList = await client.extractors.versions.list('extractorId', {
   *   organizationId: 'organizationId',
   * });
   * ```
   */
  list(
    extractorID: string,
    params: VersionListParams,
    options?: RequestOptions,
  ): APIPromise<ExtractorVersionList> {
    const { 'X-Api-Version': xAPIVersion, ...query } = params;
    return this._client.get(__scalarPath`/extractors/${extractorID}/versions`, {
      query,
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }

  /**
   * One config snapshot by number.
   *
   * @param {number} version
   * @param {VersionRetrieveParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ExtractorVersion>} The version.
   *
   * @example
   * ```ts
   * const extractorVersion = await client.extractors.versions.retrieve(1, {
   *   extractor_id: 'extractorId',
   *   organizationId: 'organizationId',
   * });
   * ```
   */
  retrieve(
    version: number,
    params: VersionRetrieveParams,
    options?: RequestOptions,
  ): APIPromise<ExtractorVersion> {
    const { extractor_id, 'X-Api-Version': xAPIVersion, ...query } = params;
    return this._client.get(__scalarPath`/extractors/${extractor_id}/versions/${version}`, {
      query,
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }
}

/**
 * ``GET /extractors/{id}/versions`` response.
 */
export interface ExtractorVersionList {
  data: Array<ExtractorVersion>;
  /**
   * @default list
   */
  object?: string;
}

/**
 * An immutable snapshot of an extractor's config.
 */
export interface ExtractorVersion {
  extractorId: string;
  /**
   * @minimum 1
   */
  version: number;
  /**
   * Extraction parameters for one run.
   *
   * Requires ``jsonSchema``, ``extractionRules``, or both, unless ``extractorId``
   * names a saved extractor, whose configuration is resolved into these fields when
   * the run is created. Neither is rejected rather than inferring a schema the
   * caller cannot inspect.
   */
  config: ExtractionAPI.ExtractConfig;
  /**
   * RFC 3339 UTC
   */
  createdAt: string;
  /**
   * @default extractor_version
   */
  object?: string;
}

export interface VersionListParams {
  /**
   * Query param: Tenant that owns the resource.
   */
  organizationId: string;
  /**
   * Header param: Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}

export interface VersionRetrieveParams {
  /**
   * Path param
   */
  extractor_id: string;
  /**
   * Query param: Tenant that owns the resource.
   */
  organizationId: string;
  /**
   * Header param: Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}
export declare namespace Versions {
  export {
    type ExtractorVersionList as ExtractorVersionList,
    type ExtractorVersion as ExtractorVersion,
    type VersionListParams as VersionListParams,
    type VersionRetrieveParams as VersionRetrieveParams,
  };
}
