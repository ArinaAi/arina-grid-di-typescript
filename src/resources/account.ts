// File generated from our OpenAPI spec by Scalar. See README.md for details.

import { APIResource } from '../resource';
import { APIPromise } from '../api-promise';
import type { RequestOptions } from '../internal/request-options';
import { buildHeaders } from '../internal/headers';

export class Account extends APIResource {
  /**
   * Resolve the presented API key to its organisation and scopes. Derived entirely from the key; the caller declares nothing.
   *
   * @param {AccountWhoAmIParams} [params] - The parameters to send with the request.
   * @param {RequestOptions} [options] - Options to apply to the request, such as headers and an abort signal.
   * @returns {APIPromise<Identity>} The key is live.
   *
   * @example
   * ```ts
   * const identity = await client.account.whoAmI();
   * ```
   */
  whoAmI(
    params: AccountWhoAmIParams | null | undefined = {},
    options?: RequestOptions,
  ): APIPromise<Identity> {
    const { 'X-Api-Version': xAPIVersion } = params ?? {};
    return this._client.get('/me', {
      ...options,
      headers: buildHeaders([
        { ...(xAPIVersion !== undefined ? { 'X-Api-Version': xAPIVersion } : {}) },
        options?.headers,
      ]),
    });
  }
}

/**
 * Who the presented credential is.
 *
 * For an API key: the organisation, the key id and its scopes. For a signed-in
 * user: the organisation, the user and the scopes their role grants. Derived
 * entirely from the credential: the caller declares nothing.
 */
export interface Identity {
  /**
   * The tenant a key belongs to.
   */
  organization: IdentityOrganization;
  /**
   * `key:<keyId>` or `user:<id>`; what audit attributes to.
   */
  subject: string;
  /**
   * What the credential may do, one entry per route group.
   */
  scopes: Array<string>;
  /**
   * Public identifier of the key; absent for a user session.
   * @default null
   */
  keyId?: string | null;
  /**
   * The signed-in person; absent for an API key.
   * @default null
   */
  user?: IdentityUser | null;
}

/**
 * The tenant a key belongs to.
 */
export interface IdentityOrganization {
  /**
   * Stable identifier of the organisation.
   */
  id: string;
  /**
   * Organisation name as used in storage and logs.
   */
  slug: string;
}

/**
 * The signed-in person, when the credential is a session rather than a key.
 */
export interface IdentityUser {
  id: string;
  email: string;
  /**
   * `owner`, `admin` or `member`.
   */
  role: string;
}

export interface AccountWhoAmIParams {
  /**
   * Contract version. Currently only `2026-09-05`. Omit to get the current version. An unsupported value is rejected with 400.
   */
  'X-Api-Version'?: string;
}
export declare namespace Account {
  export {
    type Identity as Identity,
    type IdentityOrganization as IdentityOrganization,
    type IdentityUser as IdentityUser,
    type AccountWhoAmIParams as AccountWhoAmIParams,
  };
}
