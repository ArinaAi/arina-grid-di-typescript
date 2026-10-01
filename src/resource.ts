// File generated from our OpenAPI spec by Scalar. See README.md for details.

import type { ArinaDocumentIntelligenceAPI } from './client';

export abstract class APIResource {
  protected _client: ArinaDocumentIntelligenceAPI;

  constructor(client: ArinaDocumentIntelligenceAPI) {
    this._client = client;
  }
}
