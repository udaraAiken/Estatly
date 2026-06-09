const isProduction = process.env.NODE_ENV === 'production';
const configuredSecret = process.env.JWT_SECRET;

if (isProduction && (!configuredSecret || configuredSecret.length < 32)) {
  throw new Error('JWT_SECRET must be set to at least 32 characters in production.');
}

const JWT_SECRET = configuredSecret || 'development-only-change-me-before-production';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '2h';
const REFRESH_TOKEN_EXPIRES_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || 30;

module.exports = { JWT_SECRET, JWT_EXPIRES, REFRESH_TOKEN_EXPIRES_DAYS };
