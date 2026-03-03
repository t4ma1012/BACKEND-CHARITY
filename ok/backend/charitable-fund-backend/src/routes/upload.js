const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { uploadImage } = require('../controllers/uploadController');

// POST /api/v1/upload — Yêu cầu đăng nhập, gửi FormData với field "file"
router.post('/', requireAuth, upload.single('file'), uploadImage);

module.exports = router;
