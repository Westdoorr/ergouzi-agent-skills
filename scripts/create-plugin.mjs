#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isMain, parseCliArguments } from './lib/artifacts.mjs';
import { scaffoldFromTemplate, scaffoldValues } from './lib/scaffold.mjs';

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptRoot, '..');
const TARGETS = new Set(['cross-platform', 'claude-code', 'codex']);

export async function createPlugin({
  root = repositoryRoot,
  templatesRoot = path.join(repositoryRoot, 'templates'),
  name,
  target,
  description,
}) {
  if (!TARGETS.has(target)) {
    throw new Error(
      `Unsupported plugin target "${target}". Use cross-platform, claude-code, or codex.`,
    );
  }
  const values = scaffoldValues({ name, description });
  return scaffoldFromTemplate({
    source: path.join(templatesRoot, `plugin-${target}`),
    target: path.join(root, 'plugins', name),
    values,
    createSkillsDirectory: true,
  });
}

async function main() {
  const { values, positionals } = parseCliArguments(process.argv.slice(2));
  const name = positionals[0];
  if (!name) {
    throw new Error(
      'Usage: create-plugin <name> --target <cross-platform|claude-code|codex> --description <text>',
    );
  }
  if (!values.target) throw new Error('--target is required.');
  if (!values.description) throw new Error('--description is required.');
  const target = await createPlugin({
    name,
    target: values.target,
    description: values.description,
  });
  console.log(`Created ${values.target} plugin: ${target}`);
  console.log('Run npm run catalog after adding the plugin implementation.');
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error(`create-plugin: ${error.message}`);
    process.exitCode = 1;
  });
}
