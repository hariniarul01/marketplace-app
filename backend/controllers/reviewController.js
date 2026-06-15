const { sql, poolPromise } = require('../config/db');

// Get all reviews for a product
const getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('productId', sql.Int, productId)
            .query(`
                SELECT r.ReviewID, r.Rating, r.Comment, r.CreatedAt,
                       u.UserID, u.FullName as UserName
                FROM Reviews r
                JOIN OLX_Users u ON r.UserID = u.UserID
                WHERE r.ProductID = @productId
                ORDER BY r.CreatedAt DESC
            `);
        
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Add or update review
const addReview = async (req, res) => {
    try {
        const { productId } = req.params;
        const { userId, rating, comment } = req.body;
        
        if (!userId || !rating) {
            return res.status(400).json({ message: 'User ID and Rating are required' });
        }
        
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }
        
        const pool = await poolPromise;
        
        // Check if user already reviewed
        const existingReview = await pool.request()
            .input('productId', sql.Int, productId)
            .input('userId', sql.Int, userId)
            .query('SELECT * FROM Reviews WHERE ProductID = @productId AND UserID = @userId');
        
        if (existingReview.recordset.length > 0) {
            // Update existing review
            await pool.request()
                .input('productId', sql.Int, productId)
                .input('userId', sql.Int, userId)
                .input('rating', sql.Int, rating)
                .input('comment', sql.NVarChar, comment || '')
                .query(`
                    UPDATE Reviews 
                    SET Rating = @rating, Comment = @comment, UpdatedAt = GETDATE()
                    WHERE ProductID = @productId AND UserID = @userId
                `);
        } else {
            // Add new review
            await pool.request()
                .input('productId', sql.Int, productId)
                .input('userId', sql.Int, userId)
                .input('rating', sql.Int, rating)
                .input('comment', sql.NVarChar, comment || '')
                .query(`
                    INSERT INTO Reviews (ProductID, UserID, Rating, Comment, CreatedAt, UpdatedAt)
                    VALUES (@productId, @userId, @rating, @comment, GETDATE(), GETDATE())
                `);
        }
        
        // Update product average rating
        const avgResult = await pool.request()
            .input('productId', sql.Int, productId)
            .query(`
                SELECT 
                    ISNULL(AVG(CAST(Rating AS DECIMAL(3,2))), 0) as AvgRating, 
                    COUNT(*) as ReviewCount
                FROM Reviews
                WHERE ProductID = @productId
            `);
        
        const avgRating = avgResult.recordset[0].AvgRating;
        const reviewCount = avgResult.recordset[0].ReviewCount;
        
        await pool.request()
            .input('productId', sql.Int, productId)
            .input('avgRating', sql.Decimal(3,2), avgRating)
            .input('reviewCount', sql.Int, reviewCount)
            .query(`
                UPDATE Products 
                SET AvgRating = @avgRating, ReviewCount = @reviewCount
                WHERE ProductID = @productId
            `);
        
        res.json({ 
            message: existingReview.recordset.length > 0 ? 'Review updated successfully' : 'Review added successfully',
            avgRating: avgRating,
            reviewCount: reviewCount
        });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Delete review
const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { userId } = req.body;
        
        const pool = await poolPromise;
        
        const review = await pool.request()
            .input('reviewId', sql.Int, reviewId)
            .query('SELECT ProductID FROM Reviews WHERE ReviewID = @reviewId AND UserID = @userId');
        
        if (review.recordset.length === 0) {
            return res.status(404).json({ message: 'Review not found' });
        }
        
        const productId = review.recordset[0].ProductID;
        
        await pool.request()
            .input('reviewId', sql.Int, reviewId)
            .query('DELETE FROM Reviews WHERE ReviewID = @reviewId');
        
        const avgResult = await pool.request()
            .input('productId', sql.Int, productId)
            .query(`
                SELECT 
                    ISNULL(AVG(CAST(Rating AS DECIMAL(3,2))), 0) as AvgRating, 
                    COUNT(*) as ReviewCount
                FROM Reviews
                WHERE ProductID = @productId
            `);
        
        const avgRating = avgResult.recordset[0].AvgRating;
        const reviewCount = avgResult.recordset[0].ReviewCount;
        
        await pool.request()
            .input('productId', sql.Int, productId)
            .input('avgRating', sql.Decimal(3,2), avgRating)
            .input('reviewCount', sql.Int, reviewCount)
            .query(`
                UPDATE Products 
                SET AvgRating = @avgRating, ReviewCount = @reviewCount
                WHERE ProductID = @productId
            `);
        
        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Check if user has reviewed
const hasUserReviewed = async (req, res) => {
    try {
        const { productId, userId } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('productId', sql.Int, productId)
            .input('userId', sql.Int, userId)
            .query('SELECT ReviewID, Rating, Comment FROM Reviews WHERE ProductID = @productId AND UserID = @userId');
        
        res.json({ 
            hasReviewed: result.recordset.length > 0,
            review: result.recordset[0] || null
        });
    } catch (error) {
        console.error('Error checking review:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

module.exports = {
    getProductReviews,
    addReview,
    deleteReview,
    hasUserReviewed
};