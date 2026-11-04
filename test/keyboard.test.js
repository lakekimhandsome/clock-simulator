import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as time from '../dist/time.js';

test('Space toggles playback and F toggles fullscreen without repeats or interfering with editing', async () => {
  const elements = new Map();
  const listeners = {};
  let fullscreenRequests = 0;
  let fullscreenExits = 0;
  const element = () => ({
    attributes: {}, setAttribute(name, value) { this.attributes[name] = value; }, append() {},
    listeners: {}, addEventListener(type, handler) { this.listeners[type] = handler; },
    classList: { values: new Set(), add(value) { this.values.add(value); }, remove(value) { this.values.delete(value); } },
    closest() { return false; },
  });
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, element());
      return elements.get(id);
    },
    createElementNS: element,
    body: {
      classList: { toggle() {} },
      async requestFullscreen() { fullscreenRequests++; document.fullscreenElement = this; },
    },
    async exitFullscreen() { fullscreenExits++; document.fullscreenElement = null; },
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
  const mode = elements.get('second-mode');
  mode.listeners.pointerdown({ currentTarget: mode });
  assert.equal(mode.classList.values.has('pointer-focus'), true);
  mode.listeners.keydown({ currentTarget: mode });
  assert.equal(mode.classList.values.has('pointer-focus'), false);
  mode.listeners.pointerdown({ currentTarget: mode });
  mode.listeners.blur({ currentTarget: mode });
  assert.equal(mode.classList.values.has('pointer-focus'), false);
  const input = elements.get('time');
  assert.equal(input.disabled, true);
  assert.equal(press().prevented, true);
  assert.equal(input.disabled, false);
  assert.equal(elements.get('toggle-icon').attributes.href, 'icons.svg#play');
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
  press({ code: 'KeyF' });
  assert.equal(fullscreenRequests, 1);
  assert.equal(document.fullscreenElement, document.body);
  listeners.fullscreenchange();
  assert.equal(elements.get('fullscreen-icon').attributes.href, 'icons.svg#minimize');
  assert.equal(input.disabled, false);
  press({ code: 'KeyF', repeat: true });
  for (const overrides of [
    { altKey: true }, { ctrlKey: true }, { metaKey: true }, { shiftKey: true },
    { isComposing: true }, { defaultPrevented: true },
    { target: { isContentEditable: true } },
    { target: { closest: () => true } },
  ]) assert.equal(press({ code: 'KeyF', ...overrides }).prevented, undefined);
  assert.equal(fullscreenExits, 0);
  press({ code: 'KeyF' });
  assert.equal(fullscreenExits, 1);
  assert.equal(document.fullscreenElement, null);
  listeners.fullscreenchange();
  assert.equal(elements.get('fullscreen-icon').attributes.href, 'icons.svg#maximize');
  document.body.requestFullscreen = undefined;
  press({ code: 'KeyF' });
  assert.equal(elements.get('message').textContent, '이 브라우저는 전체화면을 지원하지 않습니다.');
  document.body.requestFullscreen = async () => { throw new Error('Denied'); };
  press({ code: 'KeyF' });
  await new Promise(setImmediate);
  assert.equal(elements.get('message').textContent, '전체화면으로 전환하지 못했습니다.');
  document.fullscreenElement = document.body;
  press({ target: elements.get('fullscreen') });
  assert.equal(input.disabled, true);
  assert.equal(elements.get('toggle-icon').attributes.href, 'icons.svg#pause');
  press({ target: elements.get('toggle') });
  assert.equal(input.disabled, false);
});
