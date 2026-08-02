import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { format } from 'prettier';

import {
  checkCatalogs,
  renderCatalogs,
  writeCatalogs,
} from '../scripts/generate-catalog.mjs';
import { createRepository, writePlugin } from './helpers.mjs';

async function withRepository(run) {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'ergouzi-catalog-test-'),
  );
  await createRepository(root);
  await fs.mkdir(path.join(root, 'docs'), { recursive: true });
  return run(root);
}

test('empty repositories render valid empty catalogs', async () => {
  await withRepository(async (root) => {
    const rendered = await renderCatalogs(root);
    assert.deepEqual(rendered.claude.plugins, []);
    assert.deepEqual(rendered.codex.plugins, []);
  });
});

test('catalogs include only plugins supported by each platform', async () => {
  await withRepository(async (root) => {
    await writePlugin(root, 'zeta-cross', { claude: true, codex: true });
    await writePlugin(root, 'alpha-claude', { claude: true });
    await writePlugin(root, 'middle-codex', { codex: true });
    const rendered = await renderCatalogs(root);
    assert.deepEqual(
      rendered.claude.plugins.map((plugin) => plugin.name),
      ['alpha-claude', 'zeta-cross'],
    );
    assert.deepEqual(
      rendered.codex.plugins.map((plugin) => plugin.name),
      ['middle-codex', 'zeta-cross'],
    );
  });
});

test('catalog generation is idempotent and drift is detected', async () => {
  await withRepository(async (root) => {
    await writePlugin(root, 'stable-plugin', { claude: true, codex: true });
    await writeCatalogs(root);
    assert.deepEqual(await checkCatalogs(root), []);
    await fs.writeFile(
      path.join(root, '.claude-plugin', 'marketplace.json'),
      '{"name":"drifted","plugins":[]}\n',
    );
    assert.match((await checkCatalogs(root)).join('\n'), /out of date/i);
  });
});

test('generated Markdown is already Prettier-stable', async () => {
  await withRepository(async (root) => {
    await writeCatalogs(root);
    const catalogPath = path.join(root, 'docs', 'catalog.md');
    const content = await fs.readFile(catalogPath, 'utf8');
    assert.equal(
      await format(content, { parser: 'markdown', proseWrap: 'preserve' }),
      content,
    );
  });
});
