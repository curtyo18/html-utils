import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildManifest } from './build-manifest.mjs';

async function makeTree(spec) {
  const root = await mkdtemp(join(tmpdir(), 'html-utils-test-'));
  for (const [path, content] of Object.entries(spec)) {
    const full = join(root, path);
    await mkdir(join(full, '..'), { recursive: true });
    await writeFile(full, content);
  }
  return root;
}

test('empty tools dir returns empty tools array', async () => {
  const root = await mkdtemp(join(tmpdir(), 'html-utils-test-'));
  await mkdir(join(root, 'tools'));
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('missing tools dir returns empty tools array', async () => {
  const root = await mkdtemp(join(tmpdir(), 'html-utils-test-'));
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('single .html file at top of tools/ becomes a tool', async () => {
  const root = await makeTree({
    'tools/foo.html': '<!doctype html>',
  });
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, [
      { name: 'foo', href: 'tools/foo.html' },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('nested folders become nested groups', async () => {
  const root = await makeTree({
    'tools/text/one-line.html': '<!doctype html>',
    'tools/text/diff.html': '<!doctype html>',
  });
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, [
      {
        group: 'text',
        children: [
          { name: 'diff', href: 'tools/text/diff.html' },
          { name: 'one-line', href: 'tools/text/one-line.html' },
        ],
      },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deeply nested folders nest correctly', async () => {
  const root = await makeTree({
    'tools/games/hunt/talent-calc.html': '<!doctype html>',
  });
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, [
      {
        group: 'games',
        children: [
          {
            group: 'hunt',
            children: [
              { name: 'talent-calc', href: 'tools/games/hunt/talent-calc.html' },
            ],
          },
        ],
      },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('folder containing index.html (no subdirs) is a tool', async () => {
  const root = await makeTree({
    'tools/games/talent-calc/index.html': '<!doctype html>',
    'tools/games/talent-calc/styles.css': 'body{}',
  });
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, [
      {
        group: 'games',
        children: [
          { name: 'talent-calc', href: 'tools/games/talent-calc/' },
        ],
      },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('folder with both index.html and subdirs is treated as a group (subdirs win)', async () => {
  const root = await makeTree({
    'tools/group/index.html': '<!doctype html>',
    'tools/group/sub/tool.html': '<!doctype html>',
  });
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, [
      {
        group: 'group',
        children: [
          {
            group: 'sub',
            children: [
              { name: 'tool', href: 'tools/group/sub/tool.html' },
            ],
          },
        ],
      },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('mixed file-as-tool and folder-as-tool at same level', async () => {
  const root = await makeTree({
    'tools/text/diff.html': '<!doctype html>',
    'tools/text/converter/index.html': '<!doctype html>',
  });
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, [
      {
        group: 'text',
        children: [
          { name: 'converter', href: 'tools/text/converter/' },
          { name: 'diff', href: 'tools/text/diff.html' },
        ],
      },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('underscore- and dot-prefixed entries are ignored', async () => {
  const root = await makeTree({
    'tools/text/real.html': '<!doctype html>',
    'tools/text/_draft.html': '<!doctype html>',
    'tools/text/.hidden.html': '<!doctype html>',
    'tools/_scratch/junk.html': '<!doctype html>',
  });
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, [
      {
        group: 'text',
        children: [
          { name: 'real', href: 'tools/text/real.html' },
        ],
      },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('output is alphabetically sorted at every level', async () => {
  const root = await makeTree({
    'tools/zeta/b.html': '<!doctype html>',
    'tools/zeta/a.html': '<!doctype html>',
    'tools/alpha/x.html': '<!doctype html>',
  });
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, [
      { group: 'alpha', children: [ { name: 'x', href: 'tools/alpha/x.html' } ] },
      { group: 'zeta',  children: [
        { name: 'a', href: 'tools/zeta/a.html' },
        { name: 'b', href: 'tools/zeta/b.html' },
      ] },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('href always uses forward slashes regardless of platform', async () => {
  const root = await makeTree({
    'tools/text/one-line.html': '<!doctype html>',
  });
  try {
    const m = await buildManifest(root);
    const href = m.tools[0].children[0].href;
    assert.ok(!href.includes('\\'), `href contains backslash: ${href}`);
    assert.equal(href, 'tools/text/one-line.html');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('non-.html files in a group folder are ignored (and do not turn it into a tool)', async () => {
  const root = await makeTree({
    'tools/text/notes.txt': 'ignored',
    'tools/text/diff.html': '<!doctype html>',
  });
  try {
    const m = await buildManifest(root);
    assert.deepEqual(m.tools, [
      {
        group: 'text',
        children: [
          { name: 'diff', href: 'tools/text/diff.html' },
        ],
      },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
