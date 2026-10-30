import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrap, angleDelta, parseTime, formatTime, localTime, movementTime } from '../dist/time.js';
test('movement defaults to continuous and steps at the selected beat rate', () => {
  assert.equal(movementTime(12.789), 12.789);
  assert.equal(movementTime(12.789, 0), 12.789);
  for (const ticks of [1, 6, 8]) {
    assert.equal(movementTime(12, ticks), 12);
    assert.equal(movementTime(12 + 0.99/ticks, ticks), 12);
    assert.equal(movementTime(12 + 1.01/ticks, ticks), 12 + 1/ticks);
    assert.equal(movementTime(86399.999, ticks), 86400 - 1/ticks);
    assert.equal(movementTime(0, ticks), 0);
  }
});
test('real time uses the device local time including fractional seconds', () => {
  assert.equal(localTime(new Date(2026,9,31,23,59,59,750)),86399.75);
  assert.equal(localTime(new Date(2026,10,1,0,0,0)),0);
});
test('time wraps in both directions at midnight', () => {
  assert.equal(wrap(86401), 1); assert.equal(wrap(-1), 86399);
  assert.equal(formatTime(-1), '23:59:59'); assert.equal(formatTime(86400), '00:00:00');
});
test('drag crosses twelve in either direction without jumping', () => {
  assert.equal(angleDelta(359,1),2); assert.equal(angleDelta(1,359),-2);
  assert.equal(wrap(3599+angleDelta(354,0)/360*60),3600);
});
test('time input accepts valid times and rejects invalid input', () => {
  assert.equal(parseTime('23:59:59'),86399); assert.equal(parseTime('00:00'),0);
  for (const value of ['24:00:00','12:60:00','12:00:60','','abc','1:02:03']) assert.equal(parseTime(value),null);
});
