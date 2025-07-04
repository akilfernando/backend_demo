require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});

// Basic route for testing
app.get('/', (req, res) => {
    res.send('CartCloud API is running!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Load and use routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// In server.js or a new 'userRoutes.js'
const { protect } = require('./middleware/auth');

// Example protected route for demonstration
app.get('/api/users/profile', protect, (req, res) => {
    // req.user will contain the decoded JWT payload (userId, role)
    res.status(200).json({
        message: 'Access granted to protected profile!',
        user: req.user
    });
});