const User = require('../models/User');
const Course = require('../models/Course');

// @desc    Check if user is authenticated
// @access  Private
const protect = async (req, res, next) => {
    try {
        // Check if session exists and has user data
        if (!req.session || !req.session.user) {
            req.flash('error', 'Please log in to access this page');
            return res.redirect('/auth/login');
        }

        // Fetch fresh user data from database
        const user = await User.findById(req.session.user._id);
        if (!user) {
            req.session.destroy();
            req.flash('error', 'Please log in again');
            return res.redirect('/auth/login');
        }

        // Update session with fresh user data
        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Set user in request object
        req.user = req.session.user;

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                req.flash('error', 'Authentication error. Please try again.');
                return res.redirect('/auth/login');
            }

            next();
        });
    } catch (error) {
        req.session.destroy();
        req.flash('error', 'Authentication error. Please log in again.');
        res.redirect('/auth/login');
    }
};

// @desc    Check if user is an instructor
// @access  Private/Instructor
const isInstructor = (req, res, next) => {
    if (req.user && req.user.role === 'instructor') {
        next();
    } else {
        req.flash('error', 'You must be an instructor to access this page');
        res.redirect('/courses');
    }
};

// @desc    Check if user is the course creator
// @access  Private/Instructor
const isCourseCreator = async (req, res, next) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/courses');
        }

        if (course.createdBy.toString() === req.user._id.toString()) {
            next();
        } else {
            req.flash('error', 'You are not authorized to edit this course');
            res.redirect('/courses');
        }
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/courses');
    }
};

module.exports = { protect, isInstructor, isCourseCreator }; 