const { generateVerificationCode } = require('../index');

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
  const code = generateVerificationCode({ charset: 'ABC' , length: 5 });
  expect(code.split('').every(ch => 'ABC'.includes(ch))).toBe(true);
});

test('throws when pool empty', () => {
  expect(() => generateVerificationCode({ digits: false, lowercase: false, uppercase: false, symbols: false })).toThrow();
});

test('avoid ambiguous removes ambiguous chars', () => {
  const code = generateVerificationCode({ charset: '01lIoO2', length: 5, avoidAmbiguous: true });
  // ensure none of the ambiguous chars present
  expect(/0|1|l|I|o|O/.test(code)).toBe(false);
});
