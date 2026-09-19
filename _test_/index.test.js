const {
  generateVerificationCode,
  generateVerificationCodes,
  verifyCode,
  isCodeExpired,
  addChecksum,
  verifyChecksum
} = require('../index');

test('default length 6', () => {
  const code = generateVerificationCode();
  expect(typeof code).toBe('string');
  expect(code.length).toBe(6);
});

test('custom length', () => {
  const code = generateVerificationCode({ length: 8 });
  expect(code.length).toBe(8);
});

test('charset override', () => {
  const code = generateVerificationCode({ charset: 'ABC', length: 5 });
  expect(code.split('').every(ch => 'ABC'.includes(ch))).toBe(true);
});

test('throws when pool empty', () => {
  expect(() => generateVerificationCode({ digits: false, lowercase: false, uppercase: false, symbols: false })).toThrow();
});

test('avoid ambiguous removes ambiguous chars', () => {
  const code = generateVerificationCode({ charset: '01lIoO2', length: 5, avoidAmbiguous: true });
  expect(/0|1|l|I|o|O/.test(code)).toBe(false);
});

describe('rng injection', () => {
  test('uses custom rng deterministically', () => {
    const fixedRng = () => 0; // always picks index 0
    const code = generateVerificationCode({ charset: 'ABCDEF', length: 6, rng: fixedRng });
    expect(code).toBe('AAAAAA');
  });

  test('rejects non-function rng', () => {
    expect(() => generateVerificationCode({ rng: 'nope' })).toThrow(TypeError);
  });
});

describe('expiry / TTL', () => {
  test('returns {code, expiresAt} when expiresIn is set', () => {
    const before = Date.now();
    const result = generateVerificationCode({ expiresIn: 300 });
    expect(typeof result.code).toBe('string');
    expect(result.expiresAt).toBeGreaterThanOrEqual(before + 300 * 1000);
  });

  test('rejects invalid expiresIn', () => {
    expect(() => generateVerificationCode({ expiresIn: -5 })).toThrow(TypeError);
    expect(() => generateVerificationCode({ expiresIn: 'soon' })).toThrow(TypeError);
  });

  test('isCodeExpired reflects past/future timestamps', () => {
    expect(isCodeExpired(Date.now() - 1000)).toBe(true);
    expect(isCodeExpired(Date.now() + 60000)).toBe(false);
  });

  test('isCodeExpired rejects non-numeric input', () => {
    expect(() => isCodeExpired('not-a-timestamp')).toThrow(TypeError);
  });
});

describe('generateVerificationCodes', () => {
  test('generates the requested count', () => {
    const codes = generateVerificationCodes(10, { length: 6 });
    expect(codes.length).toBe(10);
    codes.forEach(c => expect(typeof c).toBe('string'));
  });

  test('unique:true produces distinct codes', () => {
    const codes = generateVerificationCodes(50, { length: 4, charset: 'ABCDEF', unique: true });
    expect(codes.length).toBe(50);
    expect(new Set(codes).size).toBe(50);
  });

  test('unique:true throws when pool too small for count', () => {
    expect(() =>
      generateVerificationCodes(10, { length: 1, charset: 'AB', unique: true })
    ).toThrow();
  });

  test('works with expiresIn + unique together', () => {
    const codes = generateVerificationCodes(5, { length: 4, charset: 'ABCDEF', unique: true, expiresIn: 60 });
    expect(codes.length).toBe(5);
    const uniqueCodes = new Set(codes.map(c => c.code));
    expect(uniqueCodes.size).toBe(5);
    codes.forEach(c => expect(typeof c.expiresAt).toBe('number'));
  });

  test('rejects invalid count', () => {
    expect(() => generateVerificationCodes(0)).toThrow(TypeError);
    expect(() => generateVerificationCodes(-1)).toThrow(TypeError);
  });
});

describe('verifyCode', () => {
  test('returns true for matching strings', () => {
    expect(verifyCode('123456', '123456')).toBe(true);
  });

  test('returns false for non-matching strings', () => {
    expect(verifyCode('123456', '654321')).toBe(false);
  });

  test('returns false for different lengths', () => {
    expect(verifyCode('123', '123456')).toBe(false);
  });

  test('returns false for non-string input', () => {
    expect(verifyCode(123456, '123456')).toBe(false);
    expect(verifyCode(null, '123456')).toBe(false);
  });
});

describe('checksum', () => {
  test('addChecksum appends one character', () => {
    const code = 'A3K9P2';
    const withChecksum = addChecksum(code);
    expect(withChecksum.length).toBe(code.length + 1);
    expect(withChecksum.startsWith(code)).toBe(true);
  });

  test('verifyChecksum accepts a valid code', () => {
    const withChecksum = addChecksum('A3K9P2');
    expect(verifyChecksum(withChecksum)).toBe(true);
  });

  test('verifyChecksum rejects a tampered code', () => {
    const withChecksum = addChecksum('A3K9P2');
    const tampered = withChecksum.slice(0, -1) + (withChecksum.slice(-1) === 'X' ? 'Y' : 'X');
    expect(verifyChecksum(tampered)).toBe(false);
  });

  test('verifyChecksum catches a single mistyped character', () => {
    const withChecksum = addChecksum('A3K9P2'); // e.g. "A3K9P2<check>"
    const mistyped = 'A3K9P3' + withChecksum.slice(-1); // changed '2' -> '3'
    expect(verifyChecksum(mistyped)).toBe(false);
  });

  test('verifyChecksum rejects too-short input', () => {
    expect(verifyChecksum('A')).toBe(false);
    expect(verifyChecksum('')).toBe(false);
  });

  test('addChecksum throws on empty code', () => {
    expect(() => addChecksum('')).toThrow(TypeError);
  });
});
