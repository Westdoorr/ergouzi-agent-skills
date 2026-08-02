import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { discoverSkillPaths } from '../scripts/validate-spec.mjs';

test('official spec validation discovers standalone and plugin-bundled Skills', async () => {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'skill-discovery-test-'),
  );
  await Promise.all([
    fs.mkdir(path.join(root, 'skills', 'standalone-skill'), {
      recursive: true,
    }),
    fs.mkdir(
      path.join(root, 'plugins', 'example-plugin', 'skills', 'bundled-skill'),
      {
        recursive: true,
      },
    ),
  ]);

  assert.deepEqual(await discoverSkillPaths(root), [
    path.join(root, 'skills', 'standalone-skill'),
    path.join(root, 'plugins', 'example-plugin', 'skills', 'bundled-skill'),
  ]);
});
