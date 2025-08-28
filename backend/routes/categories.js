const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { protect: auth } = require('../middleware/auth');

// Public
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);

// Protected (admin only)
router.post('/', auth, categoryController.createCategory);
router.put('/:id', auth, categoryController.updateCategory);
router.delete('/:id', auth, categoryController.deleteCategory);

module.exports = router;
