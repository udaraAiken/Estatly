const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { JWT_SECRET, JWT_EXPIRES, REFRESH_TOKEN_EXPIRES_DAYS } = require('../config/auth');

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12;

const toUserPayload = (user) => ({ id: user.id, email: user.email, role: user.role });

const signAccessToken = (user) =>
  jwt.sign(toUserPayload(user), JWT_SECRET, { expiresIn: JWT_EXPIRES });

const hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const createRefreshToken = async (userId) => {
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashRefreshToken(refreshToken);

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' days')::INTERVAL)`,
    [userId, tokenHash, REFRESH_TOKEN_EXPIRES_DAYS]
  );

  return { refreshToken, tokenHash };
};

const createAuthResponse = async (user) => {
  const token = signAccessToken(user);
  const { refreshToken } = await createRefreshToken(user.id);
  return { token, refreshToken, user };
};

// Register
const register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const role = 'buyer';

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  try {
    const normalizedEmail = email.toLowerCase();
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, phone)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, phone, created_at`,
      [name, normalizedEmail, hashedPassword, role, phone]
    );

    const user = result.rows[0];
    const authResponse = await createAuthResponse(user);

    res.status(201).json(authResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    const authResponse = await createAuthResponse(userWithoutPassword);
    res.json(authResponse);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// Refresh access token with refresh token rotation
const refresh = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token is required.' });
  }

  const tokenHash = hashRefreshToken(refreshToken);

  try {
    const result = await pool.query(
      `SELECT
         rt.token_hash,
         rt.expires_at,
         rt.revoked_at,
         u.id AS user_id,
         u.name,
         u.email,
         u.role,
         u.phone,
         u.avatar,
         u.created_at
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid refresh token.' });
    }

    const row = result.rows[0];
    if (row.revoked_at || new Date(row.expires_at) <= new Date()) {
      return res.status(401).json({ message: 'Refresh token expired or revoked.' });
    }

    const user = {
      id: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      phone: row.phone,
      avatar: row.avatar,
      created_at: row.created_at,
    };
    const token = signAccessToken(user);
    const replacement = await createRefreshToken(user.id);

    await pool.query(
      `UPDATE refresh_tokens
       SET revoked_at = NOW(), replaced_by_hash = $1
       WHERE token_hash = $2`,
      [replacement.tokenHash, tokenHash]
    );

    return res.json({ token, refreshToken: replacement.refreshToken, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error refreshing token.' });
  }
};

// Logout
const logout = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.json({ message: 'Logged out.' });
  }

  try {
    await pool.query(
      `UPDATE refresh_tokens
       SET revoked_at = COALESCE(revoked_at, NOW())
       WHERE token_hash = $1`,
      [hashRefreshToken(refreshToken)]
    );
    return res.json({ message: 'Logged out.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during logout.' });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, avatar, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, refresh, logout, getMe };
