const Course = require('../models/Course');

// Middleware to check if user is an instructor
const isInstructor = async (req, res, next) => {
    try {
        if (req.user.role !== 'instructor') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only instructors can perform this action.'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Middleware to check if user is the creator of the course
const isCourseCreator = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (course.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only the course creator can perform this action.'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    isInstructor,
    isCourseCreator
}; 