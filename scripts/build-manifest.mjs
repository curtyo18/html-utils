import { readdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const GROUP_ORDER = ['text', 'inspect', 'render', 'generate', 'numbers', 'web', 'fun'];

function groupSortKey(name) {
  const i = GROUP_ORDER.indexOf(name);
  return i === -1 ? GROUP_ORDER.length : i;
}

function isIgnored(name) {
  return name.startsWith('_') || name.startsWith('.');
}

function toPosix(p) {
  return p.split(sep).join(posix.sep);
}

async function readEntries(dir) {
  const all = await readdir(dir, { withFileTypes: true });
  return all
    .filter(e => !isIgnored(e.name))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function scanDir(absDir, repoRoot) {
  const entries = await readEntries(absDir);
  const subdirs = entries.filter(e => e.isDirectory());
  const htmlFiles = entries.filter(e => e.isFile() && e.name.endsWith('.html'));

  if (subdirs.length === 0 && htmlFiles.some(e => e.name === 'index.html')) {
    const rel = toPosix(relative(repoRoot, absDir));
    return {
      kind: 'tool-folder',
      name: posix.basename(rel),
      href: rel + '/',
    };
  }

  const children = [];
  for (const sub of subdirs) {
    const node = await buildNode(sub.name, join(absDir, sub.name), repoRoot);
    if (node) children.push(node);
  }
  for (const f of htmlFiles) {
    if (f.name === 'index.html' && subdirs.length > 0) continue;
    const rel = toPosix(relative(repoRoot, join(absDir, f.name)));
    children.push({
      name: f.name.replace(/\.html$/, ''),
      href: rel,
    });
  }

  children.sort((a, b) => {
    const an = a.name ?? a.group;
    const bn = b.name ?? b.group;
    return an.localeCompare(bn);
  });

  return { kind: 'group-children', children };
}

async function buildNode(name, absDir, repoRoot) {
  const result = await scanDir(absDir, repoRoot);
  if (result.kind === 'tool-folder') {
    return { name: result.name, href: result.href };
  }
  if (result.children.length === 0) return null;
  return { group: name, children: result.children };
}

export async function buildManifest(repoRoot) {
  const toolsDir = join(repoRoot, 'tools');
  if (!existsSync(toolsDir)) return { tools: [] };

  const result = await scanDir(toolsDir, repoRoot);
  if (result.kind === 'tool-folder') {
    return { tools: [{ name: result.name, href: result.href }] };
  }
  const tools = result.children.slice().sort((a, b) => {
    const ak = groupSortKey(a.group ?? a.name ?? '');
    const bk = groupSortKey(b.group ?? b.name ?? '');
    return ak !== bk ? ak - bk : (a.group ?? a.name ?? '').localeCompare(b.group ?? b.name ?? '');
  });
  return { tools };
}

async function main() {
  const repoRoot = process.cwd();
  const manifest = {
    generatedAt: new Date().toISOString(),
    ...(await buildManifest(repoRoot)),
  };
  const out = join(repoRoot, 'manifest.json');
  await writeFile(out, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  const count = countTools(manifest.tools);
  console.log(`wrote ${out} (${count} tool${count === 1 ? '' : 's'})`);
}

function countTools(nodes) {
  let n = 0;
  for (const node of nodes) {
    if (node.name) n += 1;
    else if (node.children) n += countTools(node.children);
  }
  return n;
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isCli) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
