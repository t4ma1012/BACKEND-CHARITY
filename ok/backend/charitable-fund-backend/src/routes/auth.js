const express = require('express');
const router = express.Router();
const { register, login, logout, refresh } = require('../controllers/authController');
const { requireAuth } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', requireAuth, logout);
router.post('/refresh', refresh);

module.exports = router;