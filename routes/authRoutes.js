const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Helper function to generate JWT
const generateToken = (user) => {
    return jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Token expires in 1 hour
    );
};

// --- POST /api/auth/register ---
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body;

        // 1. Basic Input Validation
        if (!username || !email || !password || !role) {
            return res.status(400).json({ error: 'Bad Request', details: 'All fields are required.' });
        }

        // Simple email format validation (more robust regex is better in production)
        if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
            return res.status(400).json({ error: 'Bad Request', details: 'Invalid email format.' });
        }

        // Password strength (simple example: min length)
        if (password.length < 8) {
            return res.status(400).json({ error: 'Bad Request', details: 'Password must be at least 8 characters long.' });
        }

        // Validate role
        if (!['customer', 'vendor'].includes(role)) { // Only allow customer or vendor registration
             return res.status(400).json({ error: 'Bad Request', details: 'Invalid role specified.' });
        }

        // 2. Check for Existing User
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ error: 'Conflict', details: 'User with this email or username already exists.' });
        }

        // 3. Create New User (password hashing happens in User model pre-save hook)
        const newUser = new User({ username, email, password, role });
        await newUser.save();

        // 4. Response
        res.status(201).json({
            message: 'User registered successfully. Please verify your email.',
            userId: newUser._id
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

// --- POST /api/auth/login ---
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Basic Input Validation
        if (!email || !password) {
            return res.status(400).json({ error: 'Bad Request', details: 'Email and password are required.' });
        }

        // 2. Find User by Email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized', details: 'Invalid email or password.' });
        }

        // 3. Compare Passwords
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Unauthorized', details: 'Invalid email or password.' });
        }

        // 4. Generate JWT
        const token = generateToken(user);

        // 5. Response
        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
});

module.exports = router;