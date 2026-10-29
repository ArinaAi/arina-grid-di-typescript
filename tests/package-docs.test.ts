// The generated docs ship inside the npm tarball (package.json "files") and the skills are read by agents;
// they must name THIS package and describe key-only authentication.
// Fails when the generator's packageName setting drifts from package.json (e.g. after a re-created SDK project).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { name: string };
const DOCS = [
  'api.md',
  'SKILL.md',
  'README.md',
  '.claude/skills/arina-document-intelligence-api-typescript-sdk/SKILL.md',
];
const read = (file: string) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

describe('shipped docs', () => {
  for (const file of DOCS) {
    it(`${file} names ${pkg.name} and no other package`, () => {
      const text = read(file);
      const scoped = [...text.matchAll(/@[a-z0-9_-]+\/[a-z0-9_.-]+/g)].map((m) => m[0]);
      const foreign = scoped.filter(
        (n) => n !== pkg.name && !n.endsWith('/lib') && !n.startsWith(`${pkg.name}/`),
      );
      expect(scoped, `${file} should mention the package`).toContain(pkg.name);
      expect(foreign, `${file} mentions other packages`).toEqual([]);
    });

    it(`${file} describes the key as the only credential`, () => {
      const text = read(file);
      expect(text, 'points at the namespaced credential variable').toContain('ARINA_GRID_API_KEY');
      expect(text.replaceAll('ARINA_GRID_API_KEY', ''), "names the generator's bare API_KEY").not.toMatch(
        /\bAPI_KEY\b/,
      );
      expect(text).not.toContain('ARINA_LOG');
      expect(text).not.toContain('ARINA_BASE_URL');
      for (const stale of ['SessionAuth', 'SESSION_AUTH', 'Bearer']) expect(text).not.toContain(stale);
    });

    it(`${file} never puts an organisation in a request`, () => {
      // Response models still report organizationId; requests never carry it. Catch the request-side spellings.
      const text = read(file);
      expect(text, 'organizationId in an object literal or JSON body').not.toMatch(
        /["']?organizationId["']?\s*:/,
      );
      expect(text, 'organizationId in a query string').not.toContain('organizationId=');
    });
  }
});
