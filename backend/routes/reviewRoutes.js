const express = require('express');
const router = express.Router();
const {
    getProductReviews,
    addReview,
    deleteReview,
    hasUserReviewed
} = require('../controllers/reviewController');

// Get all reviews for a product
router.get('/product/:productId', getProductReviews);

// Add or update review for a product
router.post('/product/:productId', addReview);

// Delete a review
router.delete('/:reviewId', deleteReview);

// Check if user has reviewed a product
router.get('/check/:productId/:userId', hasUserReviewed);

module.exports = router;