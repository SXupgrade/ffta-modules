import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFullConfirmMask, isDistanceConfirmed, toggleConfirmBit } from '../domain/checkScorecard.confirm.js';

test('computeFullConfirmMask: excludes the global bit (bit 0), includes every distance bit', () => {
  assert.equal(computeFullConfirmMask(0), 0);
  assert.equal(computeFullConfirmMask(1), 0b10);
  assert.equal(computeFullConfirmMask(4), 0b11110);
  assert.equal(computeFullConfirmMask(8), 0b111111110);
});

test('computeFullConfirmMask: clamps out-of-range distance counts', () => {
  assert.equal(computeFullConfirmMask(-3), computeFullConfirmMask(0));
  assert.equal(computeFullConfirmMask(20), computeFullConfirmMask(8));
});

test('isDistanceConfirmed: reads the bit for a given distance', () => {
  assert.equal(isDistanceConfirmed(0b0110, 1), true);
  assert.equal(isDistanceConfirmed(0b0110, 2), true);
  assert.equal(isDistanceConfirmed(0b0110, 3), false);
});

test('isDistanceConfirmed: distance 0 is the global confirm bit', () => {
  assert.equal(isDistanceConfirmed(0b0001, 0), true);
  assert.equal(isDistanceConfirmed(0b0010, 0), false);
});

test('toggleConfirmBit: sets and clears a bit without touching other bits', () => {
  const withDistance2 = toggleConfirmBit(0b0001, 2, true);
  assert.equal(withDistance2, 0b0101);
  const cleared = toggleConfirmBit(withDistance2, 2, false);
  assert.equal(cleared, 0b0001);
});

test('toggleConfirmBit: is idempotent', () => {
  const once = toggleConfirmBit(0, 3, true);
  const twice = toggleConfirmBit(once, 3, true);
  assert.equal(once, twice);
  const clearedOnce = toggleConfirmBit(once, 3, false);
  const clearedTwice = toggleConfirmBit(clearedOnce, 3, false);
  assert.equal(clearedOnce, clearedTwice);
  assert.equal(clearedOnce, 0);
});
