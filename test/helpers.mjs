import fs from 'node:fs/promises';
import path from 'node:path';

export async function createRepository(root) {
  await Promise.all([
    fs.mkdir(path.join(root, 'skills'), { recursive: true }),
    fs.mkdir(path.join(root, 'plugins'), { recursive: true }),
    fs.mkdir(path.join(root, '.claude-plugin'), { recursive: true }),
    fs.mkdir(path.join(root, '.agents', 'plugins'), { recursive: true }),
  ]);
  await fs.writeFile(
    path.join(root, '.claude-plugin', 'marketplace.json'),
    `${JSON.stringify(
      {
        name: 'ergouzi-agent-skills',
        owner: { name: 'Aiman Labs' },
        plugins: [],
      },
      null,
      2,
    )}\n`,
  );
  await fs.writeFile(
    path.join(root, '.agents', 'plugins', 'marketplace.json'),
    `${JSON.stringify(
      {
        name: 'ergouzi-agent-skills',
        interface: { displayName: 'Ergouzi Agent Skills' },
        plugins: [],
      },
      null,
      2,
    )}\n`,
  );
}

export async function writeSkill(
  root,
  directory,
  { name = directory, version = '0.1.0', body = '# Example Skill\n' } = {},
) {
  const skillRoot = path.join(root, 'skills', directory);
  await fs.mkdir(skillRoot, { recursive: true });
  await fs.writeFile(
    path.join(skillRoot, 'SKILL.md'),
    `---\nname: ${name}\ndescription: "Use when testing a portable example Skill."\nlicense: MIT\nmetadata:\n  author: aiman-labs\n  version: "${version}"\n---\n\n${body}`,
  );
  return skillRoot;
}

export async function writePlugin(
  root,
  name,
  {
    claude = false,
    codex = false,
    version = '0.1.0',
    codexVersion = version,
  } = {},
) {
  const pluginRoot = path.join(root, 'plugins', name);
  await fs.mkdir(pluginRoot, { recursive: true });

  if (claude) {
    const manifestRoot = path.join(pluginRoot, '.claude-plugin');
    await fs.mkdir(manifestRoot, { recursive: true });
    await fs.writeFile(
      path.join(manifestRoot, 'plugin.json'),
      `${JSON.stringify(
        {
          name,
          version,
          description: `${name} test plugin`,
          author: { name: 'Aiman Labs' },
          license: 'MIT',
        },
        null,
        2,
      )}\n`,
    );
  }

  if (codex) {
    const manifestRoot = path.join(pluginRoot, '.codex-plugin');
    await fs.mkdir(manifestRoot, { recursive: true });
    await fs.writeFile(
      path.join(manifestRoot, 'plugin.json'),
      `${JSON.stringify(
        {
          name,
          version: codexVersion,
          description: `${name} test plugin`,
          author: { name: 'Aiman Labs' },
          license: 'MIT',
          interface: {
            displayName: name,
            shortDescription: `Use ${name} in Codex.`,
            longDescription: `${name} test plugin`,
            developerName: 'Aiman Labs',
            category: 'Developer Tools',
            capabilities: [],
            defaultPrompt: `Help me use ${name}.`,
          },
        },
        null,
        2,
      )}\n`,
    );
  }

  return pluginRoot;
}
