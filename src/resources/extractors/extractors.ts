// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../../resource';
import { APIPromise } from '../../api-promise';
import type { RequestOptions } from '../../internal/request-options';
import { buildHeaders } from '../../internal/headers';
import { path as __scalarPath } from '../../internal/utils/path';
import type * as ExtractionAPI from '../extraction';
import * as VersionsAPI from './versions';
import {
  Versions,
  type ExtractorVersionList,
  type ExtractorVersion,
  type VersionListParams,
  type VersionRetrieveParams,
} from './versions';

export class Extractors extends APIResource {
  versions: VersionsAPI.Versions = new VersionsAPI.Versions(this._client);

  /**
   * Save a named, versioned extraction configuration. The schema is validated here, so a mistake is a 422 at save time.
   *
   * @param {ExtractorCreateParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<Extractor>} Created at version 1.
   *
   * @example
   * ```ts
   * const extractor = await client.extractors.create({
   *   organizationId: 'org_123',
   *   name: 'Invoice — EU vendors',
   *   description: null,
   *   config: {
   *     jsonSchema: { type: 'object', properties: { invoiceTotal: { type: ['number', 'null'] } } },
   *     citationsEnabled: true,
   *   },
   *   metadata: null,
   * });
   * ```
   */
  create(params: ExtractorCreateParams, options?: RequestOptions): APIPromise<Extractor> {
    const { 'X-Api-Version': xAPIVersion, ...body } = params;
    return this._client.post('/extractors', {
      body,
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }

  /**
   * A tenant's extractors, `ACTIVE` by default. `status=ARCHIVED|all` to widen.
   *
   * @param {ExtractorListParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ExtractorList>} The list.
   *
   * @example
   * ```ts
   * const extractorList = await client.extractors.list({
   *   organizationId: 'organizationId',
   * });
   * ```
   */
  list(params: ExtractorListParams, options?: RequestOptions): APIPromise<ExtractorList> {
    const { 'X-Api-Version': xAPIVersion, ...query } = params;
    return this._client.get('/extractors', {
      query,
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }

  /**
   * The current version of one extractor.
   *
   * @param {string} extractorID
   * @param {ExtractorRetrieveParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<Extractor>} The extractor.
   *
   * @example
   * ```ts
   * const extractor = await client.extractors.retrieve('extractorId', {
   *   organizationId: 'organizationId',
   * });
   * ```
   */
  retrieve(
    extractorID: string,
    params: ExtractorRetrieveParams,
    options?: RequestOptions,
  ): APIPromise<Extractor> {
    const { 'X-Api-Version': xAPIVersion, ...query } = params;
    return this._client.get(__scalarPath`/extractors/${extractorID}`, {
      query,
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }

  /**
   * Rename, describe or reconfigure. Only a `config` change bumps the version. Send `version` to get a 409 on a stale edit.
   *
   * @param {string} extractorID
   * @param {ExtractorUpdateParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<Extractor>} The updated extractor. A config change bumps `version`; a rename does not.
   *
   * @example
   * ```ts
   * const extractor = await client.extractors.update('extractorId', {
   *   organizationId: 'x',
   *   name: null,
   *   description: null,
   *   config: null,
   *   metadata: null,
   *   version: null,
   * });
   * ```
   */
  update(
    extractorID: string,
    params: ExtractorUpdateParams,
    options?: RequestOptions,
  ): APIPromise<Extractor> {
    const { 'X-Api-Version': xAPIVersion, ...body } = params;
    return this._client.patch(__scalarPath`/extractors/${extractorID}`, {
      body,
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }

  /**
   * Archive by default (record and versions kept, new runs refused). `permanent=true` removes the record and every version; runs already made keep their frozen config.
   *
   * @param {string} extractorID
   * @param {ExtractorDeleteParams} params - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<ExtractorDeleteResponse>} Archived extractor (default), or `{object, id, deleted: true}` when `permanent=true`.
   *
   * @example
   * ```ts
   * const extractor = await client.extractors.delete('extractorId', {
   *   organizationId: 'organizationId',
   *   permanent: false,
   * });
   * ```
   */
  delete(
    extractorID: string,
    params: ExtractorDeleteParams,
    options?: RequestOptions,
  ): APIPromise<ExtractorDeleteResponse> {
    const { organizationId, permanent, 'X-Api-Version': xAPIVersion } = params;
    return this._client.delete(__scalarPath`/extractors/${extractorID}`, {
      query: { organizationId, permanent },
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }
}

/**
 * A saved extractor at its current version.
 */
export interface Extractor {
  /**
   * Extractor identifier, prefixed 'ext_'
   */
  id: string;
  organizationId: string;
  name: string;
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
   * RFC 3339 UTC
   */
  updatedAt: string;
  /**
   * @default extractor
   */
  object?: string;
  /**
   * @default 2026-09-05
   */
  apiVersion?: string;
  /**
   * @default null
   */
  description?: string | null;
  /**
   * Open string
   * @default ACTIVE
   */
  status?: string;
  /**
   * @default null
   */
  metadata?: Record<string, unknown> | null;
}

/**
 * ``GET /extractors`` response.
 */
export interface ExtractorList {
  data: Array<Extractor>;
  /**
   * @default list
   */
  object?: string;
}

export interface ExtractorCreateParams {
  /**
   * Header param: Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
  /**
   * Body param
   * @minLength 1
   */
  organizationId: string;
  /**
   * Body param
   * @minLength 1
   * @maxLength 120
   */
  name: string;
  /**
   * Body param
   * @default null
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * Body param: Extraction parameters for one run.
   *
   * Requires ``jsonSchema``, ``extractionRules``, or both, unless ``extractorId``
   * names a saved extractor, whose configuration is resolved into these fields when
   * the run is created. Neither is rejected rather than inferring a schema the
   * caller cannot inspect.
   */
  config: ExtractionAPI.ExtractConfig;
  /**
   * Body param
   * @default null
   */
  metadata?: Record<string, unknown> | null;
}

export interface ExtractorListParams {
  /**
   * Query param: Tenant that owns the resource.
   */
  organizationId: string;
  /**
   * Query param
   */
  status?: 'ACTIVE' | 'ARCHIVED' | 'all';
  /**
   * Header param: Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}

export interface ExtractorRetrieveParams {
  /**
   * Query param: Tenant that owns the resource.
   */
  organizationId: string;
  /**
   * Header param: Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}

export interface ExtractorUpdateParams {
  /**
   * Header param: Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
  /**
   * Body param
   * @minLength 1
   */
  organizationId: string;
  /**
   * Body param
   * @default null
   * @minLength 1
   * @maxLength 120
   */
  name?: string | null;
  /**
   * Body param
   * @default null
   * @maxLength 2000
   */
  description?: string | null;
  /**
   * Body param: Extraction parameters for one run.
   *
   * Requires ``jsonSchema``, ``extractionRules``, or both, unless ``extractorId``
   * names a saved extractor, whose configuration is resolved into these fields when
   * the run is created. Neither is rejected rather than inferring a schema the
   * caller cannot inspect.
   * @default null
   */
  config?: ExtractionAPI.ExtractConfig | null;
  /**
   * Body param
   * @default null
   */
  metadata?: Record<string, unknown> | null;
  /**
   * Body param: Expected current version; 409 if it has moved on
   * @default null
   * @minimum 1
   */
  version?: number | null;
}

export interface ExtractorDeleteParams {
  /**
   * Query param: Tenant that owns the resource.
   */
  organizationId: string;
  /**
   * Query param
   * @default false
   */
  permanent?: boolean;
  /**
   * Header param: Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}

export type ExtractorDeleteResponse = Extractor | ExtractorDeleteResponse.ExtractorDeleteResponseItem;

export namespace ExtractorDeleteResponse {
  export interface ExtractorDeleteResponseItem {
    object: string;
    id: string;
    deleted: boolean;
  }
}
Extractors.Versions = Versions;

export declare namespace Extractors {
  export {
    type Extractor as Extractor,
    type ExtractorList as ExtractorList,
    type ExtractorDeleteResponse as ExtractorDeleteResponse,
    type ExtractorCreateParams as ExtractorCreateParams,
    type ExtractorListParams as ExtractorListParams,
    type ExtractorRetrieveParams as ExtractorRetrieveParams,
    type ExtractorUpdateParams as ExtractorUpdateParams,
    type ExtractorDeleteParams as ExtractorDeleteParams,
  };

  export {
    Versions as Versions,
    type ExtractorVersionList as ExtractorVersionList,
    type ExtractorVersion as ExtractorVersion,
    type VersionListParams as VersionListParams,
    type VersionRetrieveParams as VersionRetrieveParams,
  };
}
