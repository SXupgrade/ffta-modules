const DEFAULT_SEED_BYTES = 32;
const MAX_HISTORY_ITEMS = 50;

export function normalizeOptions(input, mode = 'coin') {
  if (mode === 'coin') return ['HEADS', 'TAILS'];

  const raw = Array.isArray(input)
    ? input
    : String(input || '').split(/\r?\n|,/g);

  const unique = [];
  const seen = new Set();
  for (const value of raw) {
    const label = String(value || '').trim();
    const key = label.toLocaleLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    unique.push(label);
  }
  return unique;
}

export function assertOptions(options) {
  if (!Array.isArray(options) || options.length < 2) {
    throw new Error('At least two options are required.');
  }
  if (options.length > 256) {
    throw new Error('A draw cannot contain more than 256 options.');
  }
}

export async function createTossCommitment({ mode, options, label = '', cryptoProvider = getDefaultCryptoProvider() }) {
  const normalizedOptions = normalizeOptions(options, mode);
  assertOptions(normalizedOptions);

  const seed = cryptoProvider.randomHex(DEFAULT_SEED_BYTES);
  const nonce = cryptoProvider.randomHex(16);
  const createdAt = new Date().toISOString();
  const payload = canonicalJson({ version: 1, mode, label, options: normalizedOptions, seed, nonce, createdAt });
  const commitment = await cryptoProvider.sha256Hex(payload);

  return {
    version: 1,
    id: `toss-${createdAt.replace(/[^0-9]/g, '')}-${nonce.slice(0, 8)}`,
    mode,
    label,
    options: normalizedOptions,
    seed,
    nonce,
    createdAt,
    commitment,
    status: 'prepared'
  };
}

export async function revealToss({ commitment, cryptoProvider = getDefaultCryptoProvider() }) {
  if (!commitment?.seed || !commitment?.nonce) throw new Error('Missing commitment seed.');
  const options = normalizeOptions(commitment.options, commitment.mode);
  assertOptions(options);

  const payload = canonicalJson({
    version: commitment.version || 1,
    mode: commitment.mode,
    label: commitment.label || '',
    options,
    seed: commitment.seed,
    nonce: commitment.nonce,
    createdAt: commitment.createdAt
  });
  const verifiedCommitment = await cryptoProvider.sha256Hex(payload);
  if (verifiedCommitment !== commitment.commitment) {
    throw new Error('Commitment verification failed.');
  }

  const drawHash = await cryptoProvider.sha256Hex(canonicalJson({
    purpose: 'ffta-modules:toss:draw:v1',
    commitment: commitment.commitment,
    seed: commitment.seed,
    nonce: commitment.nonce,
    options
  }));
  const index = selectUnbiasedIndex(drawHash, options.length);
  const revealedAt = new Date().toISOString();

  return {
    ...commitment,
    status: 'revealed',
    revealedAt,
    drawHash,
    resultIndex: index,
    result: options[index],
    verification: {
      algorithm: 'SHA-256 commit-reveal with rejection sampling',
      canonicalPayload: payload,
      commitment: verifiedCommitment,
      drawHash
    }
  };
}

export async function verifyTossProof(proof, cryptoProvider = getDefaultCryptoProvider()) {
  if (!proof) return { ok: false, reason: 'Missing proof.' };
  try {
    const revealed = await revealToss({ commitment: proof, cryptoProvider });
    const ok = revealed.result === proof.result && revealed.drawHash === proof.drawHash && revealed.resultIndex === proof.resultIndex;
    return { ok, reason: ok ? '' : 'Result mismatch.', revealed };
  } catch (error) {
    return { ok: false, reason: error.message || String(error) };
  }
}

export function addHistoryItem(history, item) {
  return [item, ...(Array.isArray(history) ? history : [])].slice(0, MAX_HISTORY_ITEMS);
}

export function exportProof(toss) {
  if (!toss) return null;
  return {
    version: toss.version || 1,
    id: toss.id,
    mode: toss.mode,
    label: toss.label || '',
    options: toss.options || [],
    seed: toss.seed,
    nonce: toss.nonce,
    createdAt: toss.createdAt,
    commitment: toss.commitment,
    status: toss.status,
    revealedAt: toss.revealedAt || null,
    drawHash: toss.drawHash || null,
    resultIndex: Number.isInteger(toss.resultIndex) ? toss.resultIndex : null,
    result: toss.result || null,
    verification: toss.verification || null
  };
}

export function canonicalJson(value) {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value).sort().reduce((acc, key) => {
    acc[key] = sortKeys(value[key]);
    return acc;
  }, {});
}

function selectUnbiasedIndex(hexHash, optionCount) {
  const maxByte = 256 - (256 % optionCount);
  const bytes = hexToBytes(hexHash);
  for (const byte of bytes) {
    if (byte < maxByte) return byte % optionCount;
  }
  const expanded = hexToBytes(`${hexHash}${hexHash}`);
  for (const byte of expanded) {
    if (byte < maxByte) return byte % optionCount;
  }
  return bytes[0] % optionCount;
}

function hexToBytes(hex) {
  const bytes = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return bytes;
}

function getDefaultCryptoProvider() {
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.getRandomValues) {
    throw new Error('Secure random generator is not available in this browser.');
  }
  return {
    randomHex(byteLength) {
      const bytes = new Uint8Array(byteLength);
      webCrypto.getRandomValues(bytes);
      return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    },
    async sha256Hex(text) {
      const bytes = new TextEncoder().encode(text);
      if (webCrypto.subtle?.digest) {
        const digest = await webCrypto.subtle.digest('SHA-256', bytes);
        return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
      }
      return sha256HexFallback(bytes);
    }
  };
}


function sha256HexFallback(bytes) {
  const rightRotate = (value, amount) => (value >>> amount) | (value << (32 - amount));
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];
  const hash = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const message = Array.from(bytes);
  const bitLength = message.length * 8;
  message.push(0x80);
  while ((message.length % 64) !== 56) message.push(0);
  const high = Math.floor(bitLength / 0x100000000);
  const low = bitLength >>> 0;
  for (let shift = 24; shift >= 0; shift -= 8) message.push((high >>> shift) & 0xff);
  for (let shift = 24; shift >= 0; shift -= 8) message.push((low >>> shift) & 0xff);

  for (let offset = 0; offset < message.length; offset += 64) {
    const words = new Array(64);
    for (let i = 0; i < 16; i += 1) {
      const j = offset + i * 4;
      words[i] = ((message[j] << 24) | (message[j + 1] << 16) | (message[j + 2] << 8) | message[j + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rightRotate(words[i - 15], 7) ^ rightRotate(words[i - 15], 18) ^ (words[i - 15] >>> 3);
      const s1 = rightRotate(words[i - 2], 17) ^ rightRotate(words[i - 2], 19) ^ (words[i - 2] >>> 10);
      words[i] = (words[i - 16] + s0 + words[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = hash;
    for (let i = 0; i < 64; i += 1) {
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + constants[i] + words[i]) >>> 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return hash.map((word) => word.toString(16).padStart(8, '0')).join('');
}
