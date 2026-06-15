const { sql, poolPromise } = require('../config/db');

// Create order (simplified - without cart)
const createOrder = async (req, res) => {
    try {
        const { buyerId, productId, quantity, price, shippingAddress, paymentMethod } = req.body;
        
        if (!buyerId || !shippingAddress) {
            return res.status(400).json({ message: 'Buyer ID and shipping address are required' });
        }
        
        const pool = await poolPromise;
        
        const totalAmount = (price || 0) * (quantity || 1);
        
        // Create order
        const orderResult = await pool.request()
            .input('buyerId', sql.Int, buyerId)
            .input('totalAmount', sql.Decimal(18, 2), totalAmount)
            .input('shippingAddress', sql.NVarChar, shippingAddress)
            .input('paymentMethod', sql.NVarChar, paymentMethod || 'Cash on Delivery')
            .query(`
                INSERT INTO Orders (BuyerID, OrderDate, TotalAmount, PaymentStatus, OrderStatus, ShippingAddress, PaymentMethod)
                VALUES (@buyerId, GETDATE(), @totalAmount, 'Pending', 'Processing', @shippingAddress, @paymentMethod);
                SELECT SCOPE_IDENTITY() AS OrderID;
            `);
        
        const orderId = orderResult.recordset[0].OrderID;
        
        // Add order item if product info provided
        if (productId) {
            await pool.request()
                .input('orderId', sql.Int, orderId)
                .input('productId', sql.Int, productId)
                .input('quantity', sql.Int, quantity || 1)
                .input('price', sql.Decimal(18, 2), price || 0)
                .query(`
                    INSERT INTO OrderItems (OrderID, ProductID, Quantity, Price)
                    VALUES (@orderId, @productId, @quantity, @price)
                `);
        }
        
        res.status(201).json({ 
            message: 'Order placed successfully!', 
            orderId: orderId,
            totalAmount: totalAmount
        });
    } catch (error) {
        console.error('Error in createOrder:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

// Get user orders
const getUserOrders = async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT o.OrderID, o.OrderDate, o.TotalAmount, o.PaymentStatus, o.OrderStatus,
                       o.ShippingAddress, o.PaymentMethod,
                       COUNT(oi.OrderItemID) as ItemCount
                FROM Orders o
                LEFT JOIN OrderItems oi ON o.OrderID = oi.OrderID
                WHERE o.BuyerID = @userId
                GROUP BY o.OrderID, o.OrderDate, o.TotalAmount, o.PaymentStatus, o.OrderStatus, o.ShippingAddress, o.PaymentMethod
                ORDER BY o.OrderDate DESC
            `);
        
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error in getUserOrders:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get order details
const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('orderId', sql.Int, orderId)
            .query(`
                SELECT o.*, 
                       oi.OrderItemID, oi.Quantity as ItemQuantity, oi.Price as ItemPrice,
                       p.ProductID, p.ProductName, p.Images
                FROM Orders o
                JOIN OrderItems oi ON o.OrderID = oi.OrderID
                JOIN Products p ON oi.ProductID = p.ProductID
                WHERE o.OrderID = @orderId
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('Error in getOrderDetails:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Cancel Order
const cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        
        console.log(`Cancel order request: Order ID ${id}, User ID ${userId}`);
        
        const pool = await poolPromise;
        
        // Check if order exists
        const order = await pool.request()
            .input('orderId', sql.Int, id)
            .query('SELECT * FROM Orders WHERE OrderID = @orderId');
        
        if (order.recordset.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const orderData = order.recordset[0];
        
        // Verify user owns this order
        if (orderData.BuyerID !== userId) {
            return res.status(403).json({ message: 'You can only cancel your own orders' });
        }
        
        // Check if order can be cancelled
        if (orderData.OrderStatus === 'Delivered') {
            return res.status(400).json({ message: 'Delivered orders cannot be cancelled' });
        }
        
        if (orderData.OrderStatus === 'Cancelled') {
            return res.status(400).json({ message: 'Order is already cancelled' });
        }
        
        // Update order status to Cancelled
        await pool.request()
            .input('orderId', sql.Int, id)
            .query(`UPDATE Orders SET OrderStatus = 'Cancelled' WHERE OrderID = @orderId`);
        
        console.log(`Order ${id} cancelled successfully`);
        
        res.status(200).json({ 
            message: 'Order cancelled successfully',
            orderId: id,
            status: 'Cancelled'
        });
    } catch (error) {
        console.error('Error in cancelOrder:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = {
    createOrder,
    getUserOrders,
    getOrderDetails,
    cancelOrder
};