const { sql, poolPromise } = require('../config/db');
const { sendEmail } = require('../config/email');

// Get or create conversation
const getOrCreateConversation = async (req, res) => {
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
};

// Get all conversations for a user (with unread count per conversation)
const getConversations = async (req, res) => {
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
};

// Get messages for a conversation
const getMessages = async (req, res) => {
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
};

// Send message
const sendMessage = async (req, res) => {
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
        
        // Get updated unread count for the receiver
        const unreadResult = await pool.request()
            .input('receiverId', sql.Int, receiverId)
            .query(`SELECT COUNT(*) as UnreadCount FROM Messages WHERE ReceiverID = @receiverId AND IsRead = 0`);
        
        res.json({ 
            success: true, 
            message: 'Message sent successfully',
            unreadCount: unreadResult.recordset[0].UnreadCount
        });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Mark messages as read
const markAsRead = async (req, res) => {
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
        
        // Get updated unread count for this conversation
        const conversationUnread = await pool.request()
            .input('conversationId', sql.Int, conversationId)
            .input('userId', sql.Int, userId)
            .query(`
                SELECT COUNT(*) as UnreadCount 
                FROM Messages 
                WHERE ConversationID = @conversationId AND ReceiverID = @userId AND IsRead = 0
            `);
        
        // Get total unread count for user
        const totalUnread = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT COUNT(*) as TotalUnread 
                FROM Messages 
                WHERE ReceiverID = @userId AND IsRead = 0
            `);
        
        res.json({ 
            success: true,
            conversationUnreadCount: conversationUnread.recordset[0].UnreadCount,
            totalUnreadCount: totalUnread.recordset[0].TotalUnread
        });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Get total unread count for user
const getUnreadCount = async (req, res) => {
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
};

// Get notifications
const getNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT NotificationID, Message, Type, IsRead, CreatedAt
                FROM Notifications
                WHERE UserID = @userId
                ORDER BY CreatedAt DESC
            `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = {
    getOrCreateConversation,
    getConversations,
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    getNotifications
};