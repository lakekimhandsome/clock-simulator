import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wrap, angleDelta, parseTime, formatTime } from '../dist/time.js';
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
