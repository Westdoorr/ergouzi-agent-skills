import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('CI secret scanning is license-free and checksum-pinned', async () => {
  const workflow = await fs.readFile(
    path.join(root, '.github', 'workflows', 'ci.yml'),
    'utf8',
  );
  assert.doesNotMatch(workflow, /gitleaks\/gitleaks-action/);
  assert.match(workflow, /GITLEAKS_VERSION:/);
  assert.match(workflow, /sha256sum --check/);
  assert.match(workflow, /gitleaks detect/);
});

test('CI performs dependency review with a commit-pinned action', async () => {
  const workflow = await fs.readFile(
    path.join(root, '.github', 'workflows', 'ci.yml'),
    'utf8',
  );
  assert.match(workflow, /actions\/dependency-review-action@[0-9a-f]{40}/);
  assert.match(workflow, /fail-on-severity:\s+high/);
});
