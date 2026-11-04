import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../dist/theme.js', import.meta.url), 'utf8');
function setup({ dark = false, saved = null, blocked = false } = {}) {
  const attributes = {};
  const listeners = {};
  const preference = { matches: dark, addEventListener(type, handler) { this.change = handler; } };
  const button = { setAttribute(name, value) { attributes[name] = value; }, addEventListener(type, handler) { this.click = handler; } };
  const icon = { setAttribute(name, value) { this[name] = value; } };
  const meta = {};
  const document = {
    documentElement: { dataset: {} },
    querySelector: () => meta,
    getElementById: id => id === 'theme-icon' ? icon : button,
    addEventListener(type, handler) { listeners[type] = handler; },
  };
  const storage = { value: saved, getItem() { if (blocked) throw Error('Blocked'); return this.value; }, setItem(key, value) { if (blocked) throw Error('Blocked'); this.value = value; } };
  runInNewContext(source, { window: { matchMedia: () => preference }, document, localStorage: storage });
  listeners.DOMContentLoaded();
  return { document, preference, button, icon, attributes, meta, storage };
}

test('theme follows system changes until a manual choice, then persists the choice', () => {
  const ui = setup();
  const theme = () => ui.document.documentElement.dataset.theme;
  assert.equal(theme(), 'light');
  assert.equal(ui.icon.href, 'icons.svg#moon');
  ui.preference.matches = true;
  ui.preference.change();
  assert.equal(theme(), 'dark');
  assert.equal(ui.icon.href, 'icons.svg#sun');
  assert.equal(ui.meta.content, '#000000');
  assert.equal(ui.attributes['aria-pressed'], 'true');
  assert.equal(ui.attributes['aria-label'], '라이트 모드');
  ui.button.click();
  assert.equal(theme(), 'light');
  assert.equal(ui.icon.href, 'icons.svg#moon');
  assert.equal(ui.storage.value, 'light');
  assert.equal(ui.meta.content, '#f5f4f0');
  assert.equal(ui.attributes['aria-pressed'], 'false');
  ui.preference.change();
  assert.equal(theme(), 'light');
  assert.equal(ui.icon.href, 'icons.svg#moon');
  assert.equal(setup({ dark: true, saved: ui.storage.value }).document.documentElement.dataset.theme, 'light');
  ui.button.click();
  assert.equal(ui.storage.value, 'dark');
  assert.equal(setup({ saved: 'dark' }).document.documentElement.dataset.theme, 'dark');
});

test('invalid preferences and unavailable storage do not prevent theme switching', () => {
  assert.equal(setup({ dark: true, saved: 'invalid' }).document.documentElement.dataset.theme, 'dark');
  const ui = setup({ blocked: true });
  assert.equal(ui.document.documentElement.dataset.theme, 'light');
  ui.button.click();
  assert.equal(ui.document.documentElement.dataset.theme, 'dark');
});
