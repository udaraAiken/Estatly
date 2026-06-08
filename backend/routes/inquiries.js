const router = require('express').Router();
const { createInquiry, getInquiries, updateInquiryStatus } = require('../controllers/inquiryController');
const { authMiddleware, agentMiddleware } = require('../middleware/auth');

router.post('/property/:property_id', createInquiry);
router.get('/', authMiddleware, agentMiddleware, getInquiries);
router.patch('/:id/status', authMiddleware, agentMiddleware, updateInquiryStatus);

module.exports = router;
