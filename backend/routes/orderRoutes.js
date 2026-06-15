const express = require('express');
const router = express.Router();
const {
    createOrder,
    getUserOrders,
    getOrderDetails,
    cancelOrder
} = require('../controllers/orderController');

// Create order from cart
router.post('/create', createOrder);

// Get user's orders
router.get('/user/:userId', getUserOrders);

// Get order details
router.get('/:orderId', getOrderDetails);

// Cancel order
router.patch('/:id/cancel', cancelOrder);

module.exports = router;