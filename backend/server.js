const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

// Load environment variables
dotenv.config();

const app = express();

// Middleware - CORS must be first
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase payload size limits for file uploads (important for multiple images + video)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static files (images uploaded)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Test route
app.get('/', (req, res) => {
    res.json({ 
        message: '🛍️ Marketplace API is running!',
        endpoints: {
            products: 'GET /api/products',
            productById: 'GET /api/products/:id',
            createProduct: 'POST /api/products (single image)',
            createProductMedia: 'POST /api/products/media (multiple images + video)',
            updateProduct: 'PUT /api/products/:id',
            deleteProduct: 'DELETE /api/products/:id',
            incrementView: 'POST /api/products/:id/view',
            createOrder: 'POST /api/orders/create',
            userOrders: 'GET /api/orders/user/:userId',
            orderDetails: 'GET /api/orders/:orderId',
            cancelOrder: 'PATCH /api/orders/:id/cancel',
            register: 'POST /api/auth/register',
            login: 'POST /api/auth/login',
            users: 'GET /api/auth/users',
            chat: 'POST /api/chat/conversation',
            messages: 'GET /api/chat/messages/:conversationId',
            sendMessage: 'POST /api/chat/send',
            conversations: 'GET /api/chat/conversations/:userId',
            unreadCount: 'GET /api/chat/unread/:userId',
            reviews: 'GET /api/reviews/product/:productId',
            addReview: 'POST /api/reviews/product/:productId',
            deleteReview: 'DELETE /api/reviews/:reviewId',
            checkReview: 'GET /api/reviews/check/:productId/:userId'
        }
    });
});

// Use routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reviews', reviewRoutes);

// ============================================
// MULTER ERROR HANDLER (Important for file uploads)
// ============================================
app.use((err, req, res, next) => {
    // Handle multer specific errors
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Max size is 10MB per file.' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files. Max 10 images allowed.' });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ message: 'Unexpected field name. Expected "images" for multiple files or "image" for single file.' });
        }
        if (err.code === 'LIMIT_PART_COUNT') {
            return res.status(400).json({ message: 'Too many parts. Form too large.' });
        }
        return res.status(400).json({ message: err.message });
    }
    
    // Handle file filter errors
    if (err.message && err.message.includes('Only images')) {
        return res.status(400).json({ message: err.message });
    }
    if (err.message && err.message.includes('Only video')) {
        return res.status(400).json({ message: err.message });
    }
    
    next(err);
});

// General error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ message: err.message || 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📦 Test API: http://localhost:${PORT}/api/products`);
    console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth/login`);
    console.log(`👥 Users API: http://localhost:${PORT}/api/auth/users`);
    console.log(`💬 Chat API: http://localhost:${PORT}/api/chat/conversations/1`);
    console.log(`⭐ Reviews API: http://localhost:${PORT}/api/reviews/product/1`);
    console.log(`🖼️ Images URL: http://localhost:${PORT}/uploads/`);
    console.log(`🎬 Video URL: http://localhost:${PORT}/uploads/`);
    console.log(`🏠 Home: http://localhost:${PORT}`);
});

// Increase server timeout for large file uploads
server.timeout = 300000; // 5 minutes