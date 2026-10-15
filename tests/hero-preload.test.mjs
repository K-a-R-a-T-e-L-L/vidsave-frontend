import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const script = await readFile('public/scripts/hero-preload-v1.js', 'utf8');
test('early hero respects stored/system theme, viewport and denied storage without CSS or hydration', () => {
  for (const [saved, systemDark, mobile, denied, expected] of [
    ['light', true, true, false, 'light-960'],
    ['dark', false, false, false, 'dark-1920'],
    ['auto', true, true, false, 'dark-960'],
    ['auto', false, false, false, 'light-1920'],
    [null, true, true, false, 'light-960'],
    ['invalid', true, true, false, 'light-960'],
    ['dark', true, true, true, 'light-960'],
  ]) {
    const links = [];
    const context = {
      location: { pathname: '/' },
      localStorage: {
        getItem() {
          if (denied) throw new Error('denied');
          return saved;
        },
      },
      matchMedia: (query) => ({ matches: query.includes('max-width') ? mobile : systemDark }),
      document: { createElement: () => ({}), head: { appendChild: (link) => links.push(link) } },
    };
    vm.runInNewContext(script, context);
    assert.equal(links.length, 1);
    assert.equal(links[0].href, `/images/media-pack/hero-${expected}.avif`);
    assert.equal(links[0].fetchPriority, 'high');
    context.location.pathname = '/about';
    vm.runInNewContext(script, context);
    assert.equal(links.length, 1, 'Other pages do not preload a home image');
  }
});
