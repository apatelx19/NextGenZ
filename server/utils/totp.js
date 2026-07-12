const crypto = require('crypto');

// Base32 decode implementation (RFC 4648)
function base32Decode(base32Str) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanStr = String(base32Str).toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
  let bits = '';
  
  for (let i = 0; i < cleanStr.length; i++) {
    const val = alphabet.indexOf(cleanStr[i]);
    if (val === -1) {
      throw new Error('Invalid base32 character: ' + cleanStr[i]);
    }
    bits += val.toString(2).padStart(5, '0');
  }
  
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}

// Generate TOTP for a given base32 secret and time step offset (RFC 6238)
function generateTOTP(secret, timeOffset = 0) {
  const key = base32Decode(secret);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / 30) + timeOffset;
  
  const buffer = Buffer.alloc(8);
  // Write counter as 64-bit integer
  buffer.writeUInt32BE(0, 0);
  buffer.writeUInt32BE(counter, 4);
  
  const hmac = crypto.createHmac('sha1', key);
  hmac.update(buffer);
  const hmacResult = hmac.digest();
  
  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code = (
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff)
  ) % 1000000;
  
  return code.toString().padStart(6, '0');
}

// Verify TOTP supporting a window of clock drift (+/- 1 time step)
function verifyTOTP(secret, code) {
  const cleanCode = String(code).trim();
  if (cleanCode.length !== 6 || isNaN(cleanCode)) {
    return false;
  }
  
  for (let i = -1; i <= 1; i++) {
    if (generateTOTP(secret, i) === cleanCode) {
      return true;
    }
  }
  return false;
}

// Generate a random Base32 secret for TOTP setup (16 chars, 80 bits of entropy)
function generateSecret(length = 16) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += alphabet[bytes[i] % alphabet.length];
  }
  return secret;
}

module.exports = {
  generateSecret,
  generateTOTP,
  verifyTOTP
};
