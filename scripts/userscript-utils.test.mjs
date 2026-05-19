import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseUserscriptMeta } from './userscript-utils.mjs';

test('valid block — all common keys', () => {
  const script = `// ==UserScript==
// @name        My Script
// @description Does things
// @version     1.0
// @author      Alice
// @match       https://example.com/*
// ==/UserScript==
console.log('hi');`;
  const m = parseUserscriptMeta(script);
  assert.equal(m.name, 'My Script');
  assert.equal(m.description, 'Does things');
  assert.equal(m.version, '1.0');
  assert.equal(m.author, 'Alice');
  assert.equal(m.match, 'https://example.com/*');
});

test('no metadata block → null', () => {
  assert.equal(parseUserscriptMeta('console.log("hi");'), null);
});

test('empty metadata block → null', () => {
  const script = '// ==UserScript==\n// ==/UserScript==\nconsole.log(1);';
  assert.equal(parseUserscriptMeta(script), null);
});

test('partial block — only @name present', () => {
  const script = '// ==UserScript==\n// @name Only Name\n// ==/UserScript==';
  const m = parseUserscriptMeta(script);
  assert.equal(m.name, 'Only Name');
  assert.equal(m.description, undefined);
});

test('multiple @match lines — only first is kept', () => {
  const script = '// ==UserScript==\n// @match https://a.com\n// @match https://b.com\n// ==/UserScript==';
  const m = parseUserscriptMeta(script);
  assert.equal(m.match, 'https://a.com');
});

test('values are trimmed', () => {
  const script = '// ==UserScript==\n// @name   Padded Name   \n// ==/UserScript==';
  const m = parseUserscriptMeta(script);
  assert.equal(m.name, 'Padded Name');
});

test('handles Windows line endings (CRLF)', () => {
  const script = '// ==UserScript==\r\n// @name CRLF Script\r\n// ==/UserScript==';
  const m = parseUserscriptMeta(script);
  assert.equal(m.name, 'CRLF Script');
});

import { isShareUrlTooLong } from './userscript-utils.mjs';

const BASE = 'https://curtyo18.github.io/html-utils/tools/web/userscript.html';

test('isShareUrlTooLong: short compressed → false', () => {
  assert.equal(isShareUrlTooLong('abc123', BASE), false);
});

test('isShareUrlTooLong: exactly 8000 chars total → false', () => {
  const needed = 8000 - BASE.length - '?s='.length;
  assert.equal(isShareUrlTooLong('x'.repeat(needed), BASE), false);
});

test('isShareUrlTooLong: 8001 chars total → true', () => {
  const needed = 8001 - BASE.length - '?s='.length;
  assert.equal(isShareUrlTooLong('x'.repeat(needed), BASE), true);
});
