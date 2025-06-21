const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { isInstructor, isCourseCreator } = require('../middleware/roleMiddleware');
const { 
    handleFileUpload, 
    processUpload, 
    handleFileDeletion 
} = require('../middleware/uploadMiddleware');

// @desc    Get all courses
// @route   GET /courses
// @access  Public
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        const query = search ? { title: { $regex: search, $options: 'i' } } : {};
        
        const courses = await Course.find(query)
            .populate('createdBy', 'name email')
            .populate('studentsEnrolled', 'name email')
            .sort({ createdAt: -1 }); // Sort by newest first

        console.log('CourseRoutes (GET /) - User passed to EJS:', req.session.user ? req.session.user.name : 'No user', 'Role:', req.session.user ? req.session.user.role : 'N/A');

        res.render('courses/index', { 
            courses,
            search,
            title: 'All Courses',
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        req.flash('error', 'Failed to load courses: ' + error.message);
        
        res.status(500).render('error', {
            message: 'An error occurred while loading courses.',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// @desc    Show create course form
// @route   GET /courses/create
// @access  Private/Instructor
router.get('/create', protect, isInstructor, (req, res) => {
    res.render('courses/create', { 
        title: 'Create Course',
        user: req.user
    });
});

// @desc    Create a new course
// @route   POST /courses
// @access  Private/Instructor
router.post('/', 
    protect, 
    isInstructor, 
    handleFileUpload,
    processUpload,
    async (req, res) => {
        try {
            const { title, description, price, thumbnail, video } = req.body;
            
            const course = await Course.create({
                title,
                description,
                thumbnail,
                videoURL: video,
                price,
                createdBy: req.user._id,
                instructor: req.user._id
            });

            req.flash('success', 'Course created successfully');
            res.redirect(`/courses/${course._id}`);
        } catch (error) {
            req.flash('error', error.message);
            res.redirect('/courses/create');
        }
    }
);

// @desc    Enroll in a course
// @route   POST /courses/:courseId/enroll
// @access  Private/Student
router.post('/:courseId/enroll', protect, async (req, res) => {
    try {
        console.log('Enrollment Debug - User:', {
            id: req.user._id,
            name: req.user.name,
            role: req.user.role
        });

        // Check if user is a student
        if (req.user.role !== 'student') {
            req.flash('error', 'Only students can enroll in courses');
            return res.redirect('/courses');
        }

        const course = await Course.findById(req.params.courseId);
        
        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/courses');
        }

        // Check if student is already enrolled
        if (course.studentsEnrolled.includes(req.user._id)) {
            req.flash('error', 'You are already enrolled in this course');
            return res.redirect(`/courses/${course._id}`);
        }

        // Add student to course's enrolled students
        course.studentsEnrolled.push(req.user._id);
        await course.save();

        // Add course to student's enrolled courses
        await User.findByIdAndUpdate(
            req.user._id,
            { $push: { enrolledCourses: course._id } }
        );

        // Update session with fresh user data
        const updatedUser = await User.findById(req.user._id);
        req.session.user = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role
        };

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                console.error('Session Save Error:', err);
                req.flash('error', 'Enrollment successful but session update failed');
                return res.redirect(`/courses/${course._id}`);
            }
            
            console.log('Enrollment Debug - Session updated:', {
                id: req.session.user._id,
                name: req.session.user.name,
                role: req.session.user.role
            });
            
            req.flash('success', 'Successfully enrolled in course');
            res.redirect(`/courses/${course._id}`);
        });
    } catch (error) {
        console.error('Enrollment Error:', error);
        req.flash('error', error.message);
        res.redirect('/courses');
    }
});

// @desc    Show edit course form
// @route   GET /courses/:id/edit
// @access  Private/Instructor
router.get('/:id/edit', protect, isCourseCreator, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/courses');
        }

        // Check if user is the instructor
        if (course.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', { 
                message: 'Not authorized',
                error: { status: 403 }
            });
        }

        res.render('courses/edit', { 
            course,
            title: `Edit ${course.title}`,
            user: req.user
        });
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/courses');
    }
});

// @desc    Update course
// @route   PUT /courses/:id
// @access  Private/Instructor
router.put('/:id',
    protect,
    isCourseCreator,
    handleFileUpload,
    processUpload,
    handleFileDeletion,
    async (req, res) => {
        try {
            const course = await Course.findById(req.params.id);
            
            if (!course) {
                req.flash('error', 'Course not found');
                return res.redirect('/courses');
            }

            // Update course with new file URLs if provided
            if (req.body.thumbnail) {
      course.thumbnail = req.body.thumbnail;
           }
    if (req.body.videoURL) {
    course.videoURL = req.body.videoURL; 
      }


            // Update other fields
            Object.keys(req.body).forEach(key => {
                if (key !== 'thumbnail' && key !== 'video') {
                    course[key] = req.body[key];
                }
            });

            await course.save();
            req.flash('success', 'Course updated successfully');
            res.redirect(`/courses/${course._id}`);
        } catch (error) {
            req.flash('error', error.message);
            res.redirect(`/courses/${req.params.id}/edit`);
        }
    }
);

// @desc    Delete course
// @route   DELETE /courses/:id
// @access  Private/Instructor
router.delete('/:id', protect, isInstructor, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        
        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/courses');
        }

        await course.deleteOne();
        req.flash('success', 'Course deleted successfully');
        res.redirect('/courses');
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/courses');
    }
});

// @desc    Get single course
// @route   GET /courses/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('studentsEnrolled', 'name email');

        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/courses');
        }

        // Initialize variables regardless of login status
        let isEnrolled = false;
        let canViewContent = false;

        // Get user from session
        const user = req.session.user;

        if (user) {
            // Check if the user is the creator (instructor)
            if (course.createdBy._id.toString() === user._id.toString()) {
                canViewContent = true; // Creator can always view
            }
            
            // Check if the user is a student and is enrolled
            if (user.role === 'student' && course.studentsEnrolled.some(student => student._id.toString() === user._id.toString())) {
                isEnrolled = true;
                canViewContent = true; // Enrolled student can view
            }
        }

        // Render the detail page, passing enrollment status and content view permission
        res.render('courses/detail', {
            course,
            title: course.title,
            user: user,
            isEnrolled: isEnrolled,
            canViewContent: canViewContent
        });

    } catch (error) {
        console.error('Error fetching course detail:', error);
        req.flash('error', error.message);
        res.status(500).render('error', {
            message: 'An error occurred while loading course details.',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router; 