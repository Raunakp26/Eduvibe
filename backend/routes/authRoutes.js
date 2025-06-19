const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Show register form
router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register' });
});

// Handle register form submission
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            req.flash('error', 'User already exists');
            return res.redirect('/auth/register');
        }

        // Create new user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'student'
        });

        // Set user in session
        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                req.flash('error', 'Registration successful but session creation failed');
                return res.redirect('/auth/login');
            }
            
            req.flash('success', 'Registration successful!');
            res.redirect('/courses');
        });
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/auth/register');
    }
});

// Show login form
router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login' });
});

// Handle login form submission
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        // Set user in session
        req.session.user = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // Save session explicitly
        req.session.save((err) => {
            if (err) {
                req.flash('error', 'Login failed. Please try again.');
                return res.redirect('/auth/login');
            }
            
            req.flash('success', 'Login successful!');
            res.redirect('/courses');
        });
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/auth/login');
    }
});

// Handle logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            req.flash('error', 'Error logging out');
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

// Test session persistence on POST
router.post('/test-session', (req, res) => {
    res.json({ user: req.session.user || null });
});

module.exports = router; 