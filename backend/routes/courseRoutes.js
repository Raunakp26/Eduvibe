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

// Get all courses
router.get('/', async (req, res) => {
    try {
        const search = req.query.search || '';
        const query = search ? { title: { $regex: search, $options: 'i' } } : {};

        const courses = await Course.find(query)
            .populate('createdBy', 'name email')
            .populate('studentsEnrolled', 'name email')
            .sort({ createdAt: -1 });

        res.render('courses/index', {
            courses,
            search,
            title: 'All Courses',
            user: req.session.user
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        req.flash('error', 'Failed to load courses.');
        res.status(500).render('error', { message: 'Failed to load courses.', error });
    }
});

// Show create form
router.get('/create', protect, isInstructor, (req, res) => {
    res.render('courses/create', {
        title: 'Create Course',
        user: req.user
    });
});

// Create a course
router.post('/', protect, isInstructor, handleFileUpload, processUpload, async (req, res) => {
    try {
        const { title, description, price, thumbnail, videoURL } = req.body;


        const course = await Course.create({
            title,
            description,
            thumbnail,
            videoURL,
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
});

// Enroll in course
router.post('/:courseId/enroll', protect, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            req.flash('error', 'Only students can enroll');
            return res.redirect('/courses');
        }

        const course = await Course.findById(req.params.courseId);
        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/courses');
        }

        if (course.studentsEnrolled.includes(req.user._id)) {
            req.flash('error', 'Already enrolled');
            return res.redirect(`/courses/${course._id}`);
        }

        course.studentsEnrolled.push(req.user._id);
        await course.save();

        await User.findByIdAndUpdate(req.user._id, { $push: { enrolledCourses: course._id } });

        const updatedUser = await User.findById(req.user._id);
        req.session.user = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role
        };

        req.session.save(() => {
            req.flash('success', 'Enrolled successfully');
            res.redirect(`/courses/${course._id}`);
        });
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/courses');
    }
});

// Edit form
router.get('/:id/edit', protect, isCourseCreator, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/courses');
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

// Update course
router.put('/:id', protect, isCourseCreator, handleFileUpload, processUpload, async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/courses');
        }

        const fieldsToUpdate = ['title', 'description', 'price', 'duration', 'level'];
        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                course[field] = req.body[field];
            }
        });

        if (req.body.thumbnail && req.body.thumbnail !== '') {
            course.thumbnail = req.body.thumbnail;
        }

        if (req.body.videoURL && req.body.videoURL !== '') {
            course.videoURL = req.body.videoURL;
        }

        await course.save();
        req.flash('success', 'Course updated successfully');
        res.redirect(`/courses/${course._id}`);
    } catch (error) {
        req.flash('error', error.message);
        res.redirect(`/courses/${req.params.id}/edit`);
    }
});



// View course details
router.get('/:id', async (req, res) => {
    try {
        const course = await Course.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('studentsEnrolled', 'name email');

        if (!course) {
            req.flash('error', 'Course not found');
            return res.redirect('/courses');
        }

        let isEnrolled = false;
        let canViewContent = false;
        const user = req.session.user;

        if (user) {
            if (course.createdBy._id.toString() === user._id.toString()) {
                canViewContent = true;
            }
            if (user.role === 'student' && course.studentsEnrolled.some(student => student._id.toString() === user._id.toString())) {
                isEnrolled = true;
                canViewContent = true;
            }
        }

        res.render('courses/detail', {
            course,
            title: course.title,
            user,
            isEnrolled,
            canViewContent
        });
    } catch (error) {
        req.flash('error', error.message);
        res.status(500).render('error', { message: 'Failed to load course.', error });
    }
});

module.exports = router;
