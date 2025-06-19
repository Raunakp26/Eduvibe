const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const methodOverride = require('method-override');
const sessionConfig = require('./config/session');

// ✅ Load environment variables only in development
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// ✅ Confirm environment variable is available
if (!process.env.MONGODB_URI) {
    console.error("❌ MONGODB_URI not set! Please define it in Render's Environment tab.");
    process.exit(1); // stop the server if MongoDB URI is missing
}

// ✅ Log for debugging only (REMOVE after testing)
console.log("📦 MongoDB URI loaded:", process.env.MONGODB_URI);

// ✅ Connect to MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ Connected to MongoDB Atlas");
}).catch(err => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // optional: stop if connection fails
});

// ✅ Initialize Express app
const app = express();

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(methodOverride('_method'));

// ✅ View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ✅ Session and flash setup
app.use(session(sessionConfig));
app.use(flash());

// ✅ Global variable middleware for templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.messages = {
        success: req.flash('success'),
        error: req.flash('error')
    };
    console.log('Session Debug - User:', req.session.user ? {
        id: req.session.user._id,
        name: req.session.user.name,
        role: req.session.user.role
    } : 'No user');
    next();
});

// ✅ Routes
app.use('/auth', require('./routes/authRoutes'));
app.use('/courses', require('./routes/courseRoutes'));
app.use('/users', require('./routes/userRoutes'));

// ✅ Home Route
app.get('/', (req, res) => {
    res.redirect('/courses');
});

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("❌ Global Error Handler:", err.stack);
    res.status(500).render('error', {
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// ✅ 404 Handler
app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page not found',
        error: {}
    });
});

// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌐 Access the app at http://localhost:${PORT}`);
});
