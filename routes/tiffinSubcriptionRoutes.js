const express = require('express');
const router = express.Router();
const controller = require('../controllers/tiffinSubcriptionController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// All routes start with /api/usertiffin

router.post('/', verifyToken, checkRole(['admin', 'superadmin']), controller.addSubcription);
router.get('/', verifyToken, controller.getSubcription);
router.get('/:id', verifyToken, controller.getSubcriptionById);
router.delete('/:id', verifyToken, checkRole(['admin', 'superadmin']), controller.canceSubcription);

module.exports = router;
