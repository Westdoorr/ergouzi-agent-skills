import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

import { assertArtifactName, pathExists, titleFromName } from './artifacts.mjs';

function replaceTemplate(content, values) {
  let rendered = content;
  for (const [key, value] of Object.entries(values)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  const unresolved = rendered.match(/\{\{[^}]+\}\}/g);
  if (unresolved) {
    throw new Error(`Unresolved template values: ${unresolved.join(', ')}`);
  }
  return rendered;
}

async function renderDirectory(source, target, values, { include } = {}) {
  await fs.mkdir(target, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const relative = entry.name;
    if (include && !include(relative, entry)) continue;
    const sourcePath = path.join(source, relative);
    const outputName = relative.endsWith('.tmpl')
      ? relative.slice(0, -5)
      : relative;
    const targetPath = path.join(target, outputName);
    if (entry.isDirectory()) {
      await renderDirectory(sourcePath, targetPath, values);
    } else if (entry.isFile()) {
      const rendered = replaceTemplate(
        await fs.readFile(sourcePath, 'utf8'),
        values,
      );
      await fs.writeFile(targetPath, rendered);
    }
  }
}

export function scaffoldValues({ name, description }) {
  assertArtifactName(name);
  if (typeof description !== 'string' || description.trim().length < 10) {
    throw new Error('Description must contain at least 10 characters.');
  }
  if (description.length > 1024) {
    throw new Error('Description must not exceed 1024 characters.');
  }
  const title = titleFromName(name);
  const shortDescription =
    description.length <= 64 ? description : `${description.slice(0, 61)}...`;
  return {
    name,
    name_json: JSON.stringify(name),
    title,
    title_json: JSON.stringify(title),
    description_json: JSON.stringify(description.trim()),
    short_description_json: JSON.stringify(shortDescription),
    default_prompt_json: JSON.stringify(`Use ${name} to help with this task.`),
  };
}

export async function scaffoldFromTemplate({
  source,
  target,
  values,
  include,
  createSkillsDirectory = false,
}) {
  if (await pathExists(target)) {
    throw new Error(`Target already exists: ${target}`);
  }
  const temporary = `${target}.tmp-${randomUUID()}`;
  await fs.mkdir(path.dirname(target), { recursive: true });
  try {
    await renderDirectory(source, temporary, values, { include });
    if (createSkillsDirectory) {
      const skillsDirectory = path.join(temporary, 'skills');
      await fs.mkdir(skillsDirectory, { recursive: true });
      await fs.writeFile(path.join(skillsDirectory, '.gitkeep'), '');
    }
    await fs.rename(temporary, target);
  } catch (error) {
    await fs.rm(temporary, { recursive: true, force: true });
    throw error;
  }
  return target;
}
