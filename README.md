# generate-verification-code

A lightweight, flexible JavaScript library for generating random verification codes with customizable character sets and security options.

## Features

- 🎲 Cryptographically secure random generation (when available)
- 🔧 Highly configurable character sets
- 🚫 Option to avoid ambiguous characters (0/O, 1/l/I, etc.)
- 📦 Zero dependencies
- 🌐 Works in Node.js and browsers
- 💪 TypeScript-friendly

## Installation

```bash
npm install generate-verification-code
```

## Usage

### Basic Usage

```javascript
const { generateVerificationCode } = require('generate-verification-code');

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

#### Returns

Returns a `string` containing the randomly generated verification code.

#### Throws

- `TypeError` - If `length` is not a positive integer
- `Error` - If the character pool is empty (no character types enabled)

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