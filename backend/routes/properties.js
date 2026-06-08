const router = require('express').Router();
const {
  getProperties, getProperty, createProperty, updateProperty, deleteProperty,
  getSavedProperties, toggleSaveProperty, getStats
} = require('../controllers/propertyController');
const { authMiddleware, agentMiddleware } = require('../middleware/auth');

router.get('/stats', getStats);
router.get('/', getProperties);
router.get('/saved', authMiddleware, getSavedProperties);
router.get('/:id', getProperty);
router.post('/', authMiddleware, agentMiddleware, createProperty);
router.put('/:id', authMiddleware, agentMiddleware, updateProperty);
router.delete('/:id', authMiddleware, agentMiddleware, deleteProperty);
router.post('/:id/save', authMiddleware, toggleSaveProperty);

module.exports = router;
