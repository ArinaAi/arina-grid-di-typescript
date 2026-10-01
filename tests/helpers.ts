// Offline client fixtures: a recording `fetch` and a scripted responder.
import ArinaDocumentIntelligenceAPI from '../src/index';

export const BASE_URL = 'http://api.test';
export const API_KEY = 'test-key';

export type Responder = (request: Request) => Response | Promise<Response>;

export function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

/** A minimal valid run body, as the API returns it (camelCase, declared fields present). */
export function runPayload(kind: 'extract_run' | 'parse_run' = 'extract_run', overrides: Record<string, unknown> = {}) {
  return {
    object: kind,
    id: 'run_1',
    apiVersion: '2026-09-05',
    status: 'PROCESSING',
    uploadId: 'up_1',
    documentName: 'invoice.pdf',
    organizationId: 'org_123',
    collection: null,
    config: kind === 'extract_run' ? { citationsEnabled: true, citationMode: 'block' } : { includeTextLines: false },
    output: null,
    failureReason: null,
    failureMessage: null,
    metadata: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

export function makeClient(responder: Responder) {
  const requests: Request[] = [];
  const fetchMock: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    requests.push(request);
    return responder(request);
  };
  const client = new ArinaDocumentIntelligenceAPI({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    fetch: fetchMock,
    maxRetries: 0,
  });
  return { client, requests, last: () => requests[requests.length - 1] };
}
