const router = require('express').Router();
const { body } = require('express-validator');
const { register, login, getMe } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { createRateLimiter } = require('../middleware/security');
const validate = require('../middleware/validate');

const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 });

router.post('/register', authLimiter, [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
  body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('password').isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters.'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone is too long.'),
], validate, register);

router.post('/login', authLimiter, [
  body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('password').isLength({ min: 1, max: 128 }).withMessage('Password is required.'),
], validate, login);

router.get('/me', authMiddleware, getMe);

module.exports = router;
