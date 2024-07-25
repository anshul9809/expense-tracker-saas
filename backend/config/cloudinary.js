const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'profile_pictures',
        format: async (req, file) => 'png', // supports promises as well
        public_id: (req, file) => `${req.user._id}_${Date.now()}`,
    },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
