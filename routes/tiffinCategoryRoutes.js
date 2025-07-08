const express = require('express');
const router = express.Router();
const controller = require('../controllers/tiffinCategoryController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
// All routes require login
router.use(verifyToken);
router.post('/', checkRole(['admin', 'superadmin']), controller.createOrUpdateCategory);
router.delete('/:id', checkRole(['admin', 'superadmin']), controller.deleteCategory);
router.get('/', checkRole(['admin', 'superadmin']),controller.getCategories);
router.get('/:id', checkRole(['admin', 'superadmin']),controller.getCategoryById);

module.exports = router;
