import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as time from '../dist/time.js';

test('Space toggles playback without repeats or interfering with editing', () => {
  const elements = new Map();
  const listeners = {};
  const element = () => ({
    setAttribute() {}, append() {}, addEventListener() {},
    closest() { return false; },
  });
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    createElementNS: element,
    body: { classList: { toggle() {} } },
    addEventListener(type, handler) { listeners[type] = handler; },
  };
  const source = readFileSync(new URL('../dist/app.js', import.meta.url), 'utf8');
  runInNewContext(source.replace(/^import .*;\n/, ''), {
    ...time, document, performance: { now: () => 0 }, requestAnimationFrame() {},
  });
  const press = (overrides = {}) => {
    const event = { code: 'Space', target: element(), preventDefault() { this.prevented = true; }, ...overrides };
    listeners.keydown(event);
    return event;
  };
  const input = elements.get('time');
  assert.equal(input.disabled, true);
  assert.equal(press().prevented, true);
  assert.equal(input.disabled, false);
  assert.equal(press({ repeat: true }).prevented, true);
  assert.equal(input.disabled, false);
  for (const overrides of [
    { code: 'Enter' }, { altKey: true }, { ctrlKey: true }, { metaKey: true },
    { shiftKey: true }, { isComposing: true }, { defaultPrevented: true },
    { target: { isContentEditable: true } },
    { target: { closest: () => true } },
  ]) {
    assert.equal(press(overrides).prevented, undefined);
    assert.equal(input.disabled, false);
  }
  document.fullscreenElement = document.body;
  press({ target: elements.get('fullscreen') });
  assert.equal(input.disabled, true);
  press({ target: elements.get('toggle') });
  assert.equal(input.disabled, false);
});
