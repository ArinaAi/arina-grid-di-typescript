// The generated docs ship inside the npm tarball (package.json "files"); they must name THIS package.
// Fails when the generator's packageName setting drifts from package.json (e.g. after a re-created SDK project).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as { name: string };

describe('shipped docs', () => {
  for (const file of ['api.md', 'SKILL.md', 'README.md']) {
    it(`${file} names ${pkg.name} and no other package`, () => {
      const text = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
      const scoped = [...text.matchAll(/@[a-z0-9_-]+\/[a-z0-9_.-]+/g)].map((m) => m[0]);
      const foreign = scoped.filter(
        (n) => n !== pkg.name && !n.endsWith('/lib') && !n.startsWith(`${pkg.name}/`),
      );
      expect(scoped, `${file} should mention the package`).toContain(pkg.name);
      expect(foreign, `${file} mentions other packages`).toEqual([]);
    });
  }
});
