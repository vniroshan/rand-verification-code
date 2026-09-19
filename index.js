'use strict';

const DEFAULT_CHECKSUM_CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate a random verification code string.
 *
 * @param {Object} [opts]
 * @param {number} [opts.length=6] - code length
 * @param {boolean} [opts.digits=true] - include digits 0-9
 * @param {boolean} [opts.lowercase=false] - include lowercase letters
 * @param {boolean} [opts.uppercase=true] - include uppercase letters
 * @param {boolean} [opts.symbols=false] - include symbols (!@#$...)
 * @param {boolean} [opts.avoidAmbiguous=true] - avoid 0 O o 1 l I etc.
 * @param {string} [opts.charset] - override charset completely
 * @param {number} [opts.expiresIn] - if set, code expires this many seconds from now.
 *   When provided, returns `{ code, expiresAt }` instead of a plain string.
 * @param {Function} [opts.rng] - custom random source, called with no arguments and
 *   expected to return a float in [0, 1), like `Math.random`. Overrides the built-in
 *   crypto-based generator (useful for deterministic tests).
 * @returns {string|{code: string, expiresAt: number}}
 */
function generateVerificationCode(opts = {}) {
  const {
    length = 6,
    digits = true,
    lowercase = false,
    uppercase = true,
    symbols = false,
    avoidAmbiguous = true,
    charset: customCharset,
    expiresIn,
    rng
  } = opts;

  if (!Number.isInteger(length) || length <= 0) {
    throw new TypeError('length must be a positive integer');
  }

  if (rng !== undefined && typeof rng !== 'function') {
    throw new TypeError('rng must be a function');
  }

  if (expiresIn !== undefined && (typeof expiresIn !== 'number' || !Number.isFinite(expiresIn) || expiresIn <= 0)) {
    throw new TypeError('expiresIn must be a positive number of seconds');
  }

  const ambiguous = '0O1lI|`o';
  const digitChars = '0123456789';
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const symbolChars = '!@#$%^&*()-_=+[]{};:,.<>?';

  let pool = '';

  if (customCharset && typeof customCharset === 'string' && customCharset.length > 0) {
    pool = customCharset;
  } else {
    if (digits) pool += digitChars;
    if (lowercase) pool += lowerChars;
    if (uppercase) pool += upperChars;
    if (symbols) pool += symbolChars;
  }

  if (!pool) {
    throw new Error('Character pool is empty. Enable at least one character type or provide a charset.');
  }

  if (avoidAmbiguous) {
    pool = pool.split('').filter(c => !ambiguous.includes(c)).join('');
  }

  // Use crypto if available for stronger randomness
  const crypto = (typeof require !== 'undefined' && require('crypto')) || null;
  const randInt = (max) => {
    if (typeof rng === 'function') {
      return Math.floor(rng() * max);
    }
    if (crypto && crypto.randomBytes) {
      // generate a uniform random integer in [0, max)
      const randBytes = crypto.randomBytes(4).readUInt32BE(0);
      return randBytes % max;
    }
    return Math.floor(Math.random() * max);
  };

  let result = '';
  for (let i = 0; i < length; i++) {
    const idx = randInt(pool.length);
    result += pool[idx];
  }

  if (expiresIn !== undefined) {
    return { code: result, expiresAt: Date.now() + expiresIn * 1000 };
  }

  return result;
}

/**
 * Generate multiple verification codes at once.
 *
 * @param {number} count - how many codes to generate
 * @param {Object} [opts] - same options as generateVerificationCode
 * @param {boolean} [opts.unique=false] - dedupe so all returned codes are distinct
 * @returns {Array<string|{code: string, expiresAt: number}>}
 */
function generateVerificationCodes(count, opts = {}) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new TypeError('count must be a positive integer');
  }

  const { unique = false, ...genOpts } = opts;

  if (!unique) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      codes.push(generateVerificationCode(genOpts));
    }
    return codes;
  }

  const codes = [];
  const seen = new Set();
  const maxAttempts = Math.max(count * 100, 1000);
  let attempts = 0;

  while (seen.size < count) {
    if (attempts++ >= maxAttempts) {
      throw new Error('Unable to generate enough unique codes; increase length/charset or reduce count.');
    }
    const generated = generateVerificationCode(genOpts);
    const code = typeof generated === 'string' ? generated : generated.code;
    if (!seen.has(code)) {
      seen.add(code);
      codes.push(generated);
    }
  }

  return codes;
}

/**
 * Constant-time string comparison, safe against timing attacks.
 * Use this instead of `input === code` when checking a user-supplied code.
 *
 * @param {string} input - the value supplied by the user
 * @param {string} code - the expected verification code
 * @returns {boolean}
 */
function verifyCode(input, code) {
  if (typeof input !== 'string' || typeof code !== 'string') {
    return false;
  }

  const crypto = (typeof require !== 'undefined' && require('crypto')) || null;

  if (crypto && typeof crypto.timingSafeEqual === 'function') {
    const a = Buffer.from(input, 'utf8');
    const b = Buffer.from(code, 'utf8');
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  }

  // Fallback constant-time comparison when crypto.timingSafeEqual is unavailable.
  if (input.length !== code.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < input.length; i++) {
    diff |= input.charCodeAt(i) ^ code.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Check whether an expiry timestamp (as returned by generateVerificationCode
 * with `expiresIn`) has passed.
 *
 * @param {number} expiresAt - timestamp in ms since epoch
 * @returns {boolean}
 */
function isCodeExpired(expiresAt) {
  if (typeof expiresAt !== 'number' || !Number.isFinite(expiresAt)) {
    throw new TypeError('expiresAt must be a numeric timestamp in ms');
  }
  return Date.now() >= expiresAt;
}

/**
 * Luhn mod N check-character computation.
 * @private
 */
function computeCheckChar(code, charset) {
  const n = charset.length;
  let factor = 2;
  let sum = 0;

  for (let i = code.length - 1; i >= 0; i--) {
    const ch = code[i].toUpperCase();
    const codePoint = charset.indexOf(ch);
    if (codePoint === -1) {
      throw new Error(`Character "${code[i]}" not found in checksum charset`);
    }
    let addend = factor * codePoint;
    factor = factor === 2 ? 1 : 2;
    addend = Math.floor(addend / n) + (addend % n);
    sum += addend;
  }

  const remainder = sum % n;
  const checkCodePoint = (n - remainder) % n;
  return charset[checkCodePoint];
}

/**
 * Append a Luhn mod N check character to a code, so a single mistyped
 * character can be detected before hitting your backend.
 *
 * @param {string} code
 * @param {Object} [opts]
 * @param {string} [opts.charset] - charset the code is drawn from (default: 0-9A-Z)
 * @returns {string} code with the check character appended
 */
function addChecksum(code, opts = {}) {
  const { charset = DEFAULT_CHECKSUM_CHARSET } = opts;
  if (typeof code !== 'string' || code.length === 0) {
    throw new TypeError('code must be a non-empty string');
  }
  return code + computeCheckChar(code, charset);
}

/**
 * Verify a code that was produced by addChecksum.
 *
 * @param {string} codeWithChecksum
 * @param {Object} [opts]
 * @param {string} [opts.charset] - must match the charset used in addChecksum
 * @returns {boolean}
 */
function verifyChecksum(codeWithChecksum, opts = {}) {
  const { charset = DEFAULT_CHECKSUM_CHARSET } = opts;
  if (typeof codeWithChecksum !== 'string' || codeWithChecksum.length < 2) {
    return false;
  }
  const code = codeWithChecksum.slice(0, -1);
  const checkChar = codeWithChecksum.slice(-1).toUpperCase();
  try {
    return computeCheckChar(code, charset) === checkChar;
  } catch (err) {
    return false;
  }
}

module.exports = {
  generateVerificationCode,
  generateVerificationCodes,
  verifyCode,
  isCodeExpired,
  addChecksum,
  verifyChecksum
};
module.exports.default = generateVerificationCode;
