const { sql, poolPromise } = require('../config/db');

const OrderModel = {
    // Create order from cart
    createOrder: async (buyerId, shippingAddress, paymentMethod) => {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        
        try {
            await transaction.begin();
            
            // Get cart items
            const cartResult = await transaction.request()
                .input('buyerId', sql.Int, buyerId)
                .query(`
                    SELECT c.ProductID, c.Quantity, p.Price
                    FROM Cart c
                    JOIN Products p ON c.ProductID = p.ProductID
                    WHERE c.BuyerID = @buyerId
                `);
            
            if (cartResult.recordset.length === 0) {
                throw new Error('Cart is empty');
            }
            
            // Calculate total amount
            let totalAmount = 0;
            cartResult.recordset.forEach(item => {
                totalAmount += item.Price * item.Quantity;
            });
            
            // Create order
            const orderResult = await transaction.request()
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
            
            // Add order items
            for (const item of cartResult.recordset) {
                await transaction.request()
                    .input('orderId', sql.Int, orderId)
                    .input('productId', sql.Int, item.ProductID)
                    .input('quantity', sql.Int, item.Quantity)
                    .input('price', sql.Decimal(18, 2), item.Price)
                    .query(`
                        INSERT INTO OrderItems (OrderID, ProductID, Quantity, Price)
                        VALUES (@orderId, @productId, @quantity, @price)
                    `);
            }
            
            // Clear cart
            await transaction.request()
                .input('buyerId', sql.Int, buyerId)
                .query(`DELETE FROM Cart WHERE BuyerID = @buyerId`);
            
            await transaction.commit();
            
            return { orderId, totalAmount };
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    },
    
    // Get user orders
    getUserOrders: async (userId) => {
        try {
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
            return result.recordset;
        } catch (error) {
            throw error;
        }
    },
    
    // Get order details
    getOrderDetails: async (orderId) => {
        try {
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
            return result.recordset;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = OrderModel;