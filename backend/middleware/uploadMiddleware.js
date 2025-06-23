// Final working upload middleware using Cloudinary
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Course = require('../models/Course');

const cloudinary = require('../utils/cloudinary');

const createUploadDirs = () => {
    const dirs = ['uploads/temp'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};
createUploadDirs();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
        file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Thumbnail must be an image'), false);
    } else if (file.fieldname === 'video') {
        file.mimetype.startsWith('video/') ? cb(null, true) : cb(new Error('Video must be a video file'), false);
    } else {
        cb(new Error('Invalid field name'), false);
    }
};

const upload = multer({ storage, fileFilter });

const handleFileUpload = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]);

const processUpload = async (req, res, next) => {
    try {
        const { thumbnail, video } = req.files || {};

        // 👇 Check if new thumbnail is uploaded, else keep existing one
        if (thumbnail && thumbnail[0]) {
            const result = await cloudinary.uploader.upload(thumbnail[0].path, {
                folder: 'thumbnails',
            });
            fs.unlinkSync(thumbnail[0].path);
            req.body.thumbnail = result.secure_url;
        } else if (req.body.existingThumbnail) {
            req.body.thumbnail = req.body.existingThumbnail;
        }

        // 👇 Check if new video is uploaded, else keep existing one
        if (video && video[0]) {
            const result = await cloudinary.uploader.upload(video[0].path, {
                folder: 'videos',
                resource_type: 'video',
            });
            fs.unlinkSync(video[0].path);
            req.body.videoURL = result.secure_url;
        } else if (req.body.existingVideoURL) {
            req.body.videoURL = req.body.existingVideoURL;
        }

        next();
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        req.flash('error', 'Error uploading to Cloudinary');
        res.redirect(req.originalUrl);
    }
};

const handleFileDeletion = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return next();
        next();
    } catch (error) {
        console.error('Deletion error:', error);
        req.flash('error', 'Error deleting files');
        res.redirect('/courses');
    }
};

module.exports = {
    handleFileUpload,
    processUpload,
    handleFileDeletion
};
