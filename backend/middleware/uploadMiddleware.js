const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Course = require('../models/Course');

// Create upload directories if they don't exist
const createUploadDirs = () => {
    const dirs = ['public/uploads/thumbnails', 'public/uploads/videos'];
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

createUploadDirs();

// Configure storage for all files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = file.fieldname === 'thumbnail' 
            ? 'public/uploads/thumbnails'
            : 'public/uploads/videos';
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'thumbnail') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Please upload an image file for thumbnail'), false);
        }
    } else if (file.fieldname === 'video') {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Please upload a video file'), false);
        }
    } else {
        cb(new Error('Invalid field name'), false);
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: function (req, file, cb) {
            if (file.fieldname === 'thumbnail') {
                cb(null, 2 * 1024 * 1024); // 2MB for thumbnails
            } else {
                cb(null, 500 * 1024 * 1024); // 500MB for videos
            }
        }
    }
});

// Middleware for handling file uploads
const handleFileUpload = upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'video', maxCount: 1 }
]);

// Middleware to process upload results
const processUpload = (req, res, next) => {
    try {
        // For course creation
        if (req.path === '/') {
            if (!req.files) {
                req.flash('error', 'Please upload both thumbnail and video');
                return res.redirect('/courses/create');
            }

            const { thumbnail, video } = req.files;

            if (!thumbnail || !video) {
                req.flash('error', 'Please upload both thumbnail and video');
                return res.redirect('/courses/create');
            }

            // Add file URLs to request body
            req.body.thumbnail = `/uploads/thumbnails/${thumbnail[0].filename}`;
            req.body.video = `/uploads/videos/${video[0].filename}`;
        }
        // For course update
        else if (req.files) {
            const { thumbnail, video } = req.files;

            if (thumbnail) {
                req.body.thumbnail = `/uploads/thumbnails/${thumbnail[0].filename}`;
            }
            if (video) {
                req.body.video = `/uploads/videos/${video[0].filename}`;
            }
        }

        next();
    } catch (error) {
        req.flash('error', error.message || 'Error processing file upload');
        res.redirect(req.path === '/' ? '/courses/create' : `/courses/${req.params.id}/edit`);
    }
};

// Middleware to handle file deletion
const handleFileDeletion = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            return next();
        }

        // Delete old thumbnail if new one is uploaded
        if (req.body.thumbnail && course.thumbnail) {
            const thumbnailPath = path.join(__dirname, '..', 'public', course.thumbnail);
            if (fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }
        }

        // Delete old video if new one is uploaded
        if (req.body.video && course.videoURL) {
            const videoPath = path.join(__dirname, '..', 'public', course.videoURL);
            if (fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
        }

        next();
    } catch (error) {
        req.flash('error', 'Error deleting old files');
        res.redirect('/courses');
    }
};

module.exports = {
    handleFileUpload,
    processUpload,
    handleFileDeletion
}; 