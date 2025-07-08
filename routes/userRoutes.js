const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getUsers);                // GET /api/users
router.post('/', userController.createAndUpdateUser);    // POST /api/users
router.put('/', userController.createAndUpdateUser);     // PUT /api/users
router.get('/:id', userController.getUserById);          // GET /api/users/:id
router.delete('/:id', userController.deleteUser);        // DELETE /api/users/:id

module.exports = router;
