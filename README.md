# rand-verification-code

A lightweight, flexible JavaScript library for generating random verification codes with customizable character sets and security options.

## Features

- 🎲 Cryptographically secure random generation (when available)
- 🔧 Highly configurable character sets
- 🚫 Option to avoid ambiguous characters (0/O, 1/l/I, etc.)
- ⏱️ Built-in expiry/TTL support
- 🔐 Timing-safe code verification
- 🔢 Batch generation with uniqueness guarantees
- ✅ Checksum digit for typo detection
- 🎯 Pluggable RNG for deterministic testing
- 📦 Zero dependencies
- 🌐 Works in Node.js and browsers
- 💪 TypeScript-friendly

## Installation

```bash
npm install rand-verification-code
```

## Usage

### Basic Usage

```javascript
const { generateVerificationCode } = require('rand-verification-code');

// Generate a 6-character code with digits and uppercase letters (default)
const code = generateVerificationCode();
console.log(code); // Example: "A3K9P2"
```

### Custom Configuration

```javascript
// 8-digit numeric code
const numericCode = generateVerificationCode({
  length: 8,
  digits: true,
  uppercase: false
});
console.log(numericCode); // Example: "48273956"

// Alphanumeric with lowercase
const mixedCode = generateVerificationCode({
  length: 10,
  digits: true,
  lowercase: true,
  uppercase: true
});
console.log(mixedCode); // Example: "Kj8mN3pQr2"

// Include symbols
const strongCode = generateVerificationCode({
  length: 12,
  digits: true,
  uppercase: true,
  lowercase: true,
  symbols: true
});
console.log(strongCode); // Example: "aB3#xY9@mK!p"

// Custom character set
const customCode = generateVerificationCode({
  length: 6,
  charset: 'ABCDEF0123456789' // Hexadecimal
});
console.log(customCode); // Example: "A3F90B"
```

## API

### `generateVerificationCode([options])`

Generates a random verification code string.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `length` | `number` | `6` | Length of the generated code |
| `digits` | `boolean` | `true` | Include digits (0-9) |
| `lowercase` | `boolean` | `false` | Include lowercase letters (a-z) |
| `uppercase` | `boolean` | `true` | Include uppercase letters (A-Z) |
| `symbols` | `boolean` | `false` | Include symbols (!@#$%^&*...) |
| `avoidAmbiguous` | `boolean` | `true` | Avoid ambiguous characters (0, O, o, 1, l, I, etc.) |
| `charset` | `string` | `undefined` | Custom character set (overrides all other character options) |
| `expiresIn` | `number` | `undefined` | If set, code expires this many seconds from now. Changes the return value to `{ code, expiresAt }` |
| `rng` | `function` | `undefined` | Custom random source, called with no arguments and expected to return a float in `[0, 1)`, like `Math.random`. Overrides the built-in crypto-based generator |

#### Returns

Returns a `string` containing the randomly generated verification code, or `{ code, expiresAt }` when `expiresIn` is set.

#### Throws

- `TypeError` - If `length` is not a positive integer
- `TypeError` - If `expiresIn` is provided and is not a positive number
- `TypeError` - If `rng` is provided and is not a function
- `Error` - If the character pool is empty (no character types enabled)

### `generateVerificationCodes(count, [options])`

Generates multiple verification codes at once. Accepts the same options as `generateVerificationCode`, plus:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `unique` | `boolean` | `false` | Dedupe internally so every returned code is distinct |

```javascript
const { generateVerificationCodes } = require('rand-verification-code');

const codes = generateVerificationCodes(100, { length: 6, unique: true });
```

Throws a `TypeError` if `count` is not a positive integer, and an `Error` if `unique: true` is requested but the character pool/length is too small to produce that many distinct codes.

### `verifyCode(input, code)`

Timing-safe comparison for checking a user-supplied code against the expected one. Uses `crypto.timingSafeEqual` under the hood (with a constant-time fallback), so it doesn't leak timing information the way `input === code` can.

```javascript
const { verifyCode } = require('rand-verification-code');

verifyCode(userInput, expectedCode); // true / false
```

### `isCodeExpired(expiresAt)`

Checks whether an expiry timestamp (as returned by `generateVerificationCode` with `expiresIn`) has passed.

```javascript
const { generateVerificationCode, isCodeExpired } = require('rand-verification-code');

const { code, expiresAt } = generateVerificationCode({ length: 6, expiresIn: 300 }); // 5 min
isCodeExpired(expiresAt); // false, until 5 minutes pass
```

### `addChecksum(code, [options])` / `verifyChecksum(codeWithChecksum, [options])`

Appends (and later verifies) a Luhn mod N check character, so a single mistyped character can be caught before hitting your backend. Most useful for manually-entered codes; less useful for SMS/email OTPs that are copy-pasted.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `charset` | `string` | `0-9A-Z` | Charset the code is drawn from; must match between `addChecksum` and `verifyChecksum` |

```javascript
const { addChecksum, verifyChecksum } = require('rand-verification-code');

const withChecksum = addChecksum('A3K9P2'); // e.g. "A3K9P2Q"
verifyChecksum(withChecksum); // true
verifyChecksum('A3K9P3Q');    // false — typo caught
```

## Examples

### Email Verification Code

```javascript
const emailCode = generateVerificationCode({
  length: 6,
  digits: true,
  uppercase: true,
  lowercase: false,
  avoidAmbiguous: true
});
// Example: "A3K9P2"
```

### SMS Verification Code

```javascript
const smsCode = generateVerificationCode({
  length: 4,
  digits: true,
  uppercase: false,
  lowercase: false
});
// Example: "7392"
```

### Strong Password Reset Token

```javascript
const resetToken = generateVerificationCode({
  length: 32,
  digits: true,
  uppercase: true,
  lowercase: true,
  symbols: true,
  avoidAmbiguous: false
});
// Example: "aB3#xY9@mK!pQ2$wR5^nT8&vU7*zC4"
```

## Security

This library uses `crypto.randomBytes()` when available (Node.js environment) for cryptographically secure random number generation. In browser environments or when crypto is unavailable, it falls back to `Math.random()`.

**Note:** For security-critical applications, ensure you're running in an environment where `crypto.randomBytes()` is available.

Always compare user-supplied codes with [`verifyCode`](#verifycodeinput-code) instead of `input === code` — a plain string comparison can leak timing information about how many leading characters matched, which an attacker can use to guess the code character-by-character. `verifyCode` uses `crypto.timingSafeEqual()` (with a constant-time fallback) to avoid that.

## Browser Support

This library works in all modern browsers and Node.js environments. When using in browsers, make sure to bundle it with your preferred build tool (Webpack, Rollup, etc.).

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

Niroshan Vijayarasa

## Support

If you encounter any issues or have questions, please file an issue on the [GitHub repository](https://github.com/vniroshan/rand-verification-code).