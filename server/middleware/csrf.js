const { doubleCsrf } = require('csrf-csrf');

const {
  doubleCsrfProtection,
  generateCsrfToken: generateToken
} = doubleCsrf({
  getSecret: () => process.env.JWT_SECRET || 'fallback_secret_must_change',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => req.headers['x-csrf-token'],
  getSessionIdentifier: (req) => req.cookies?.adminToken || 'anonymous',
});

module.exports = {
  doubleCsrfProtection,
  generateToken,
};
