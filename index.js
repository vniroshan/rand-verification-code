'use strict';

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
 * @returns {string}
 */
function generateVerificationCode(opts = {}) {
  const {
    length = 6,
    digits = true,
    lowercase = false,
    uppercase = true,
    symbols = false,
    avoidAmbiguous = true,
    charset: customCharset
  } = opts;

  if (!Number.isInteger(length) || length <= 0) {
    throw new TypeError('length must be a positive integer');
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
  return result;
}

module.exports = { generateVerificationCode };
module.exports.default = generateVerificationCode;
