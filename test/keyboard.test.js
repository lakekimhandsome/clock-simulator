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
    children: [], replaceChildren() { this.children = []; },
    attributes: {}, setAttribute(name, value) { this.attributes[name] = value; }, append(child) { this.children.push(child); },
    listeners: {}, addEventListener(type, handler) { this.listeners[type] = handler; },
    classList: { values: new Set(), add(value) { this.values.add(value); }, remove(value) { this.values.delete(value); } },
    closest() { return false; }, blur() {}, setPointerCapture() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: 600, height: 600 }; },
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
  const cycle = elements.get('hour-cycle');
  const numbers = elements.get('numbers');
  const hour = elements.get('hour');
  assert.equal(numbers.children.length, 12);
  const originalAngle = Number(hour.attributes.transform.match(/rotate\(([^ ]+)/)[1]);
  cycle.listeners.change({ target: { value: '24' } });
  assert.equal(numbers.children.length, 24);
  assert.equal(numbers.children.at(-1).textContent, 24);
  assert.equal(Number(hour.attributes.transform.match(/rotate\(([^ ]+)/)[1]), originalAngle / 2);
  cycle.listeners.change({ target: { value: '12' } });
  assert.equal(numbers.children.length, 12);
  assert.equal(Number(hour.attributes.transform.match(/rotate\(([^ ]+)/)[1]), originalAngle);
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
  for (const [hours, expected] of [['24', '06:00:00'], ['12', '03:00:00']]) {
    cycle.listeners.change({ target: { value: hours } });
    input.listeners.change({ target: { value: '00:00:00' } });
    hour.listeners.pointerdown({ pointerId: 1, clientX: 300, clientY: 0, preventDefault() {} });
    hour.listeners.pointermove({ pointerId: 1, clientX: 600, clientY: 300 });
    hour.listeners.pointerup({ pointerId: 1 });
    assert.equal(input.value, expected);
    hour.listeners.keydown({ key: 'ArrowUp', preventDefault() {} });
    assert.equal(input.value, hours === '24' ? '07:00:00' : '04:00:00');
  }
});
