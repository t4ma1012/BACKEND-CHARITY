const cloudinary = require('../config/cloudinary');

/**
 * POST /upload
 * Upload ảnh lên Cloudinary
 * Body: FormData với field "file" + optional "folder" (kyc | campaigns | proofs)
 * Response: { url, etag }
 */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng chọn file ảnh' });
    }

    // Folder trên Cloudinary, mặc định "charitable-fund"
    const folder = req.body.folder
      ? `charitable-fund/${req.body.folder}`
      : 'charitable-fund';

    // Upload từ buffer (memory storage) lên Cloudinary
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    res.status(200).json({
      url: result.secure_url,
      etag: result.etag
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Upload thất bại', error: error.message });
  }
};

module.exports = { uploadImage };
