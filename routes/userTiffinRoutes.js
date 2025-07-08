const express = require('express');
const router = express.Router();
const controller = require('../controllers/userTiffinController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

// All routes start with /api/usertiffin

router.post('/', verifyToken, checkRole(['admin', 'superadmin']), controller.createOrUpdateUserTiffin);
router.get('/', verifyToken, controller.getAllUserTiffins);
router.get('/:id', verifyToken, controller.getUserTiffinById);
router.delete('/:id', verifyToken, checkRole(['admin', 'superadmin']), controller.cancelUserTiffin);

module.exports = router;
