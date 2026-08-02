#!/usr/bin/env node

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isMain, parseCliArguments } from './lib/artifacts.mjs';
import { scaffoldFromTemplate, scaffoldValues } from './lib/scaffold.mjs';

const scriptRoot = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptRoot, '..');

export async function createSkill({
  root = repositoryRoot,
  templatesRoot = path.join(repositoryRoot, 'templates'),
  name,
  description,
  withOpenAiMetadata = false,
}) {
  const values = scaffoldValues({ name, description });
  values.default_prompt_json = JSON.stringify(
    `Use $${name} to help with this task.`,
  );
  return scaffoldFromTemplate({
    source: path.join(templatesRoot, 'skill'),
    target: path.join(root, 'skills', name),
    values,
    include: (entryName) => withOpenAiMetadata || entryName !== 'agents',
  });
}

async function main() {
  const { values, flags, positionals } = parseCliArguments(
    process.argv.slice(2),
  );
  const name = positionals[0];
  if (!name) throw new Error('Usage: create-skill <name> --description <text>');
  if (!values.description) throw new Error('--description is required.');
  const target = await createSkill({
    name,
    description: values.description,
    withOpenAiMetadata: flags.has('with-openai-metadata'),
  });
  console.log(`Created portable Skill: ${target}`);
}

if (isMain(import.meta.url)) {
  main().catch((error) => {
    console.error(`create-skill: ${error.message}`);
    process.exitCode = 1;
  });
}
