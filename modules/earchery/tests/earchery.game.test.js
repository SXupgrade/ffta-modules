import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialGameState, registerShot, scoreImpact, startGame, updateTarget } from '../domain/earchery.game.js';

test('scoreImpact returns 10 for a center impact', () => {
  const target = { x: 100, y: 100, radius: 50 };
  const result = scoreImpact({ x: 100, y: 100 }, target);
  assert.equal(result.points, 10);
  assert.equal(result.label, 'X');
});

test('scoreImpact returns miss outside the target radius', () => {
  const target = { x: 100, y: 100, radius: 50 };
  const result = scoreImpact({ x: 180, y: 100 }, target);
  assert.equal(result.points, 0);
  assert.equal(result.label, 'M');
});

test('registerShot increments score and consumes shots', () => {
  const state = startGame(createInitialGameState());
  const next = registerShot(state, { x: state.target.x, y: state.target.y });
  assert.equal(next.score, 10);
  assert.equal(next.shots.length, 1);
  assert.equal(next.remainingShots, 11);
  assert.equal(next.status, 'running');
});

test('registerShot finishes after 12 shots', () => {
  let state = startGame(createInitialGameState());
  for (let i = 0; i < 12; i += 1) {
    state = registerShot(state, { x: state.target.x, y: state.target.y });
  }
  assert.equal(state.status, 'finished');
  assert.equal(state.remainingShots, 0);
  assert.equal(state.score, 120);
});

test('updateTarget bounces on arena edges', () => {
  const target = { x: 95, y: 50, radius: 10, vx: 100, vy: 0 };
  const next = updateTarget(target, { width: 100, height: 100 }, 1);
  assert.equal(next.x, 90);
  assert.equal(next.vx, -100);
});
