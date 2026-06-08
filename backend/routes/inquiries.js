const router = require('express').Router();
const { body, param } = require('express-validator');
const { createInquiry, getInquiries, updateInquiryStatus } = require('../controllers/inquiryController');
const { authMiddleware, agentMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.post('/property/:property_id', [
  param('property_id').isInt({ min: 1 }).withMessage('Property id must be valid.'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters.'),
  body('email').trim().isEmail().normalizeEmail().withMessage('A valid email is required.'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone is too long.'),
  body('message').trim().isLength({ min: 5, max: 2000 }).withMessage('Message must be 5-2000 characters.'),
], validate, createInquiry);
router.get('/', authMiddleware, agentMiddleware, getInquiries);
router.patch('/:id/status', authMiddleware, agentMiddleware, [
  param('id').isInt({ min: 1 }).withMessage('Inquiry id must be valid.'),
  body('status').isIn(['new', 'read', 'replied', 'closed']).withMessage('Status is invalid.'),
], validate, updateInquiryStatus);

module.exports = router;
