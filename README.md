# Udemy Clone

A full-stack web application that replicates core features of Udemy, built with Node.js, Express, MongoDB, and EJS.

## Features

- User authentication (Register/Login)
- Role-based access control (Student/Instructor)
- Course creation and management
- Course enrollment
- File uploads (images and videos) using Cloudinary
- Responsive design with Bootstrap 5

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Cloudinary account

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd udemy-clone
```

2. Install dependencies:
```bash
cd backend
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/udemy-clone
SESSION_SECRET=your-super-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h
```

4. Start MongoDB:
```bash
mongod
```

5. Start the application:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Project Structure

```
backend/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Database models
├── public/         # Static files
├── routes/         # Route definitions
├── utils/          # Utility functions
├── views/          # EJS templates
└── app.js         # Application entry point
```

## API Endpoints

### Authentication
- POST /auth/register - Register a new user
- POST /auth/login - Login user
- GET /auth/logout - Logout user

### Courses
- GET /courses - List all courses
- GET /courses/create - Show course creation form
- POST /courses - Create a new course
- GET /courses/:id - View course details
- POST /courses/:id/enroll - Enroll in a course
- GET /courses/enrolled - View enrolled courses

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 