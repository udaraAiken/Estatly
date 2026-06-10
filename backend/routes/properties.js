const router = require('express').Router();
const { body, param, query } = require('express-validator');
const {
  getProperties, getProperty, createProperty, updateProperty, deleteProperty,
  getSavedProperties, toggleSaveProperty, getStats
} = require('../controllers/propertyController');
const { authMiddleware, agentMiddleware } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { compareProperties } = require('../controllers/compareController');

router.get('/stats', getStats);
router.get('/compare', compareProperties);
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
  query('order').optional().isIn(['ASC', 'DESC']).withMessage('Order must be ASC or DESC.'),
  query('sort').optional().isIn(['price', 'created_at', 'area_sqft', 'views', 'bedrooms']).withMessage('Sort is invalid.'),
  query('status').optional().isIn(['active', 'pending', 'sold', 'rented', 'inactive']).withMessage('Status is invalid.'),
], validate, getProperties);
router.get('/saved', authMiddleware, getSavedProperties);
router.get('/:id', param('id').isInt({ min: 1 }).withMessage('Property id must be valid.'), validate, getProperty);
router.post('/', authMiddleware, agentMiddleware, [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters.'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }).withMessage('Description is too long.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('property_type').optional({ checkFalsy: true }).isIn(['house', 'apartment', 'condo', 'townhouse', 'land', 'commercial']).withMessage('Property type is invalid.'),
  body('listing_type').optional({ checkFalsy: true }).isIn(['sale', 'rent']).withMessage('Listing type is invalid.'),
  body('address').trim().isLength({ min: 3, max: 255 }).withMessage('Address must be 3-255 characters.'),
  body('city').trim().isLength({ min: 2, max: 100 }).withMessage('City must be 2-100 characters.'),
  body('state').trim().isLength({ min: 2, max: 100 }).withMessage('State must be 2-100 characters.'),
  body('features').optional().isArray({ max: 50 }).withMessage('Features must be an array.'),
  body('images').optional().isArray({ max: 20 }).withMessage('Images must be an array.'),
], validate, createProperty);
router.put('/:id', authMiddleware, agentMiddleware, [
  param('id').isInt({ min: 1 }).withMessage('Property id must be valid.'),
  body('status').optional().isIn(['active', 'pending', 'sold', 'rented', 'inactive']).withMessage('Status is invalid.'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('title').optional().trim().isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters.'),
  body('description').optional({ checkFalsy: true }).trim().isLength({ max: 5000 }).withMessage('Description is too long.'),
  body('features').optional().isArray({ max: 50 }).withMessage('Features must be an array.'),
  body('images').optional().isArray({ max: 20 }).withMessage('Images must be an array.'),
], validate, updateProperty);
router.delete('/:id', authMiddleware, agentMiddleware, param('id').isInt({ min: 1 }).withMessage('Property id must be valid.'), validate, deleteProperty);
router.post('/:id/save', authMiddleware, param('id').isInt({ min: 1 }).withMessage('Property id must be valid.'), validate, toggleSaveProperty);

module.exports = router;
