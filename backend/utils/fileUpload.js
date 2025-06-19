const cloudinary = require('./cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure image upload
const imageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'course-thumbnails',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
    }
});

// Configure video upload
const videoStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'course-videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi'],
        transformation: [
            { format: 'mp4' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ]
    }
});

// Create multer upload instances
const uploadImage = multer({ storage: imageStorage });
const uploadVideo = multer({ storage: videoStorage });

// Function to delete file from Cloudinary
const deleteFile = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        throw new Error('Error deleting file from Cloudinary');
    }
};

// Function to get file details from Cloudinary URL
const getFileDetails = (url) => {
    try {
        const publicId = url.split('/').slice(-1)[0].split('.')[0];
        return {
            publicId,
            url
        };
    } catch (error) {
        throw new Error('Error parsing Cloudinary URL');
    }
};

module.exports = {
    uploadImage,
    uploadVideo,
    deleteFile,
    getFileDetails
}; 