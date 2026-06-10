import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createTossCommitment, normalizeOptions, revealToss, verifyTossProof } from '../domain/toss.provablyFair.js';

const cryptoProvider = {
  randomHex(byteLength) {
    return 'ab'.repeat(byteLength);
  },
  async sha256Hex(text) {
    return createHash('sha256').update(text).digest('hex');
  }
};

test('normalizeOptions removes empty values and duplicates', () => {
  assert.deepEqual(normalizeOptions('Alice\nBob\nalice\n\nCharlie', 'draw'), ['Alice', 'Bob', 'Charlie']);
});

test('commitment can be revealed and verified', async () => {
  const commitment = await createTossCommitment({
    mode: 'draw',
    label: 'Test draw',
    options: 'Alice\nBob',
    cryptoProvider
  });

  assert.equal(commitment.status, 'prepared');
  assert.equal(commitment.options.length, 2);
  assert.ok(commitment.commitment);

  const revealed = await revealToss({ commitment, cryptoProvider });
  assert.equal(revealed.status, 'revealed');
  assert.ok(['Alice', 'Bob'].includes(revealed.result));
  assert.ok(revealed.drawHash);

  const verification = await verifyTossProof(revealed, cryptoProvider);
  assert.equal(verification.ok, true);
});

test('tampered proof is rejected', async () => {
  const commitment = await createTossCommitment({ mode: 'coin', cryptoProvider });
  const revealed = await revealToss({ commitment, cryptoProvider });
  const verification = await verifyTossProof({ ...revealed, result: 'Fake' }, cryptoProvider);
  assert.equal(verification.ok, false);
});
