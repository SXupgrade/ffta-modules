import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const moduleRoot = path.resolve(path.dirname(__filename), '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(moduleRoot, relativePath), 'utf8'));
}

function collectTranslationKeys() {
  const keys = new Set();
  const stack = [moduleRoot];

  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      const relativePath = path.relative(moduleRoot, fullPath).replace(/\\/g, '/');
      if (entry.isDirectory()) {
        if (!['.git', 'node_modules'].includes(entry.name)) stack.push(fullPath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
      if (relativePath.startsWith('tests/')) continue;

      const source = fs.readFileSync(fullPath, 'utf8');
      const regex = /app\.t\(\s*['"](records\.[^'"]+)['"]/g;
      let match;
      while ((match = regex.exec(source))) keys.add(match[1]);
    }
  }

  return [...keys].sort();
}

function resolveKey(pack, key) {
  const [, ...parts] = key.split('.');
  let value = pack;
  for (const part of parts) value = value?.[part];
  return value;
}

test('records i18n packs cover every app.t records key', () => {
  const en = readJson('i18n/en.json');
  const fr = readJson('i18n/fr.json');
  const keys = collectTranslationKeys();

  assert.ok(keys.length > 0, 'Expected at least one records i18n key usage.');

  for (const key of keys) {
    assert.equal(typeof resolveKey(en, key), 'string', `Missing EN translation for ${key}`);
    assert.equal(typeof resolveKey(fr, key), 'string', `Missing FR translation for ${key}`);
  }
});

test('records i18n packs use the same league-compatible nested shape', () => {
  const en = readJson('i18n/en.json');
  const fr = readJson('i18n/fr.json');

  const dottedEnKeys = Object.keys(en).filter((key) => key.includes('.'));
  const dottedFrKeys = Object.keys(fr).filter((key) => key.includes('.'));

  assert.deepEqual(dottedEnKeys, [], 'EN pack must not contain top-level dotted fallback keys.');
  assert.deepEqual(dottedFrKeys, [], 'FR pack must not contain top-level dotted fallback keys.');
});
