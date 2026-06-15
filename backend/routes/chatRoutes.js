const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');
const { sendEmail } = require('../config/email');

// Get or create conversation
router.post('/conversation', async (req, res) => {
    try {
        const { productId, buyerId, sellerId } = req.body;
        const pool = await poolPromise;
        
        let result = await pool.request()
            .input('productId', sql.Int, productId)
            .input('buyerId', sql.Int, buyerId)
            .input('sellerId', sql.Int, sellerId)
            .query(`SELECT ConversationID FROM Conversations 
                    WHERE ProductID = @productId AND BuyerID = @buyerId AND SellerID = @sellerId`);
        
        let conversationId;
        
        if (result.recordset.length === 0) {
            result = await pool.request()
                .input('productId', sql.Int, productId)
                .input('buyerId', sql.Int, buyerId)
                .input('sellerId', sql.Int, sellerId)
                .query(`
                    INSERT INTO Conversations (ProductID, BuyerID, SellerID, CreatedAt, UpdatedAt)
                    VALUES (@productId, @buyerId, @sellerId, GETDATE(), GETDATE());
                    SELECT SCOPE_IDENTITY() AS ConversationID;
                `);
            conversationId = result.recordset[0].ConversationID;
        } else {
            conversationId = result.recordset[0].ConversationID;
        }
        
        res.json({ conversationId });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Get all conversations for a user
router.get('/conversations/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT 
                    c.ConversationID, 
                    c.ProductID, 
                    c.BuyerID, 
                    c.SellerID, 
                    c.CreatedAt, 
                    c.UpdatedAt,
                    p.ProductName, 
                    p.Price,
                    CASE 
                        WHEN c.BuyerID = @userId THEN u_seller.FullName
                        ELSE u_buyer.FullName
                    END as OtherUserName,
                    CASE 
                        WHEN c.BuyerID = @userId THEN u_seller.UserID
                        ELSE u_buyer.UserID
                    END as OtherUserID,
                    ISNULL((
                        SELECT TOP 1 Message FROM Messages WHERE ConversationID = c.ConversationID ORDER BY CreatedAt DESC
                    ), '') as LastMessage,
                    ISNULL((
                        SELECT TOP 1 CreatedAt FROM Messages WHERE ConversationID = c.ConversationID ORDER BY CreatedAt DESC
                    ), GETDATE()) as LastMessageTime,
                    ISNULL((
                        SELECT COUNT(*) FROM Messages WHERE ConversationID = c.ConversationID AND ReceiverID = @userId AND IsRead = 0
                    ), 0) as UnreadCount
                FROM Conversations c
                JOIN Products p ON c.ProductID = p.ProductID
                JOIN OLX_Users u_buyer ON c.BuyerID = u_buyer.UserID
                JOIN OLX_Users u_seller ON c.SellerID = u_seller.UserID
                WHERE c.BuyerID = @userId OR c.SellerID = @userId
                ORDER BY c.UpdatedAt DESC
            `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Get messages for a conversation
router.get('/messages/:conversationId', async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { userId } = req.query;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('conversationId', sql.Int, conversationId)
            .query(`
                SELECT m.MessageID, m.SenderID, m.ReceiverID, m.Message, m.IsRead, m.CreatedAt,
                       u_sender.FullName as SenderName,
                       u_receiver.FullName as ReceiverName
                FROM Messages m
                JOIN OLX_Users u_sender ON m.SenderID = u_sender.UserID
                JOIN OLX_Users u_receiver ON m.ReceiverID = u_receiver.UserID
                WHERE m.ConversationID = @conversationId
                ORDER BY m.CreatedAt ASC
            `);
        
        const unreadResult = await pool.request()
            .input('conversationId', sql.Int, conversationId)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT COUNT(*) as UnreadCount FROM Messages 
                WHERE ConversationID = @conversationId AND ReceiverID = @userId AND IsRead = 0
            `);
        
        res.json({
            messages: result.recordset,
            unreadCount: unreadResult.recordset[0].UnreadCount
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Send message with notifications
router.post('/send', async (req, res) => {
    try {
        const { conversationId, senderId, receiverId, message } = req.body;
        const pool = await poolPromise;
        
        const convResult = await pool.request()
            .input('conversationId', sql.Int, conversationId)
            .query(`
                SELECT c.*, p.ProductName, p.Price,
                       u_sender.Email as SenderEmail, u_sender.FullName as SenderName,
                       u_receiver.Email as ReceiverEmail, u_receiver.FullName as ReceiverName
                FROM Conversations c
                JOIN Products p ON c.ProductID = p.ProductID
                JOIN OLX_Users u_sender ON c.BuyerID = u_sender.UserID
                JOIN OLX_Users u_receiver ON c.SellerID = u_receiver.UserID
                WHERE c.ConversationID = @conversationId
            `);
        
        const conversation = convResult.recordset[0];
        
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }
        
        await pool.request()
            .input('conversationId', sql.Int, conversationId)
            .input('senderId', sql.Int, senderId)
            .input('receiverId', sql.Int, receiverId)
            .input('message', sql.NVarChar, message)
            .query(`
                INSERT INTO Messages (ConversationID, SenderID, ReceiverID, Message, IsRead, CreatedAt)
                VALUES (@conversationId, @senderId, @receiverId, @message, 0, GETDATE())
            `);
        
        await pool.request()
            .input('conversationId', sql.Int, conversationId)
            .query(`UPDATE Conversations SET UpdatedAt = GETDATE() WHERE ConversationID = @conversationId`);
        
        // Create in-app notification for receiver
        const notificationMessage = `📩 New message from ${conversation.SenderName} about "${conversation.ProductName}"`;
        await pool.request()
            .input('userId', sql.Int, receiverId)
            .input('notificationMessage', sql.NVarChar, notificationMessage)
            .input('type', sql.NVarChar, 'message')
            .input('relatedId', sql.Int, conversationId)
            .query(`
                INSERT INTO Notifications (UserID, Message, Type, RelatedID, CreatedAt, IsRead)
                VALUES (@userId, @notificationMessage, @type, @relatedId, GETDATE(), 0)
            `);
        
        // Send email notification
        const emailSubject = `🔔 New Message from ${conversation.SenderName} regarding ${conversation.ProductName}`;
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #8b6dd4 0%, #c9a5e0 100%); color: white; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h2 style="margin: 0;">📩 New Message Received</h2>
                </div>
                <div style="padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
                    <p><strong>From:</strong> ${conversation.SenderName}</p>
                    <p><strong>Product:</strong> ${conversation.ProductName}</p>
                    <p><strong>Price:</strong> ₹${conversation.Price}</p>
                    <div style="background-color: white; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #8b6dd4;">
                        <p style="margin: 0;"><strong>Message:</strong></p>
                        <p style="margin: 10px 0 0 0;">"${message}"</p>
                    </div>
                    <hr>
                    <p style="color: #666; font-size: 12px;">Login to your marketplace account to reply to this message.</p>
                </div>
                <div style="text-align: center; padding: 20px; background-color: #f0f0f0; border-radius: 0 0 12px 12px;">
                    <a href="http://localhost:3000" style="background: linear-gradient(135deg, #8b6dd4 0%, #c9a5e0 100%); color: white; padding: 10px 20px; text-decoration: none; border-radius: 25px;">Go to Marketplace</a>
                </div>
            </div>
        `;
        
        sendEmail(conversation.ReceiverEmail, emailSubject, emailHtml).catch(console.error);
        
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Mark messages as read
router.put('/read/:conversationId/:userId', async (req, res) => {
    try {
        const { conversationId, userId } = req.params;
        const pool = await poolPromise;
        
        await pool.request()
            .input('conversationId', sql.Int, conversationId)
            .input('userId', sql.Int, userId)
            .query(`
                UPDATE Messages 
                SET IsRead = 1 
                WHERE ConversationID = @conversationId AND ReceiverID = @userId AND IsRead = 0
            `);
        
        // Mark notifications as read
        await pool.request()
            .input('userId', sql.Int, userId)
            .input('conversationId', sql.Int, conversationId)
            .query(`
                UPDATE Notifications 
                SET IsRead = 1 
                WHERE UserID = @userId AND RelatedID = @conversationId AND IsRead = 0
            `);
        
        // Get total unread count
        const totalUnread = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT COUNT(*) as TotalUnread 
                FROM Messages 
                WHERE ReceiverID = @userId AND IsRead = 0
            `);
        
        res.json({ 
            success: true,
            totalUnreadCount: totalUnread.recordset[0].TotalUnread
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Get unread count
router.get('/unread/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT COUNT(*) as UnreadCount 
                FROM Messages 
                WHERE ReceiverID = @userId AND IsRead = 0
            `);
        
        res.json({ unreadCount: result.recordset[0].UnreadCount });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// =============================================
// NOTIFICATION ROUTES (ADD THESE)
// =============================================

// Get notifications for user
router.get('/notifications/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT NotificationID, Message, Type, RelatedID, IsRead, CreatedAt
                FROM Notifications
                WHERE UserID = @userId
                ORDER BY CreatedAt DESC
            `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

// Mark single notification as read
router.put('/notifications/:notificationId/read', async (req, res) => {
    try {
        const { notificationId } = req.params;
        const pool = await poolPromise;
        
        await pool.request()
            .input('notificationId', sql.Int, notificationId)
            .query(`UPDATE Notifications SET IsRead = 1 WHERE NotificationID = @notificationId`);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
});

module.exports = router;