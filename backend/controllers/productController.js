const { sql, poolPromise } = require('../config/db');

// Get all products
const getProducts = async (req, res) => {
    try {
        const pool = await poolPromise;
        
        // Get query parameters
        const { search, category, minPrice, maxPrice } = req.query;
        
        console.log('Received query params:', { search, category, minPrice, maxPrice });
        
        let query = `SELECT ProductID, SellerID, ProductName, Description, Price, Category, Condition, Location, Images, VideoUrl, IsAvailable, ISNULL(ViewCount, 0) as ViewCount, ISNULL(AvgRating, 0) as AvgRating, ISNULL(ReviewCount, 0) as ReviewCount, CreatedAt FROM Products WHERE IsAvailable = 1`;
        let request = pool.request();
        
        // Add search filter
        if (search && search.trim() !== '') {
            query += ` AND (ProductName LIKE @search OR Description LIKE @search)`;
            request = request.input('search', sql.NVarChar, `%${search}%`);
        }
        
        // Add category filter
        if (category && category !== '' && category !== 'All Categories') {
            query += ` AND Category = @category`;
            request = request.input('category', sql.NVarChar, category);
        }
        
        // Add price range filter - FIXED
        if (minPrice && minPrice !== '' && !isNaN(parseFloat(minPrice))) {
            query += ` AND Price >= @minPrice`;
            request = request.input('minPrice', sql.Decimal(18, 2), parseFloat(minPrice));
            console.log('Added minPrice filter:', minPrice);
        }
        
        if (maxPrice && maxPrice !== '' && !isNaN(parseFloat(maxPrice))) {
            query += ` AND Price <= @maxPrice`;
            request = request.input('maxPrice', sql.Decimal(18, 2), parseFloat(maxPrice));
            console.log('Added maxPrice filter:', maxPrice);
        }
        
        query += ` ORDER BY ProductID DESC`;
        
        console.log('Final SQL Query:', query);
        
        const result = await request.query(query);
        
        console.log(`Found ${result.recordset.length} products`);
        
        const products = result.recordset.map(product => ({
            ...product,
            ImageUrl: product.Images ? `http://localhost:5000/uploads/${product.Images.split(',')[0]}` : null,
            AllImages: product.Images ? product.Images.split(',') : [],
            VideoUrl: product.VideoUrl ? `http://localhost:5000/uploads/${product.VideoUrl}` : null
        }));
        
        res.status(200).json(products);
    } catch (error) {
        console.error('Error in getProducts:', error);
        res.status(200).json([]);
    }
};

// Get single product
const getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`SELECT ProductID, SellerID, ProductName, Description, Price, Category, Condition, Location, Images, VideoUrl, IsAvailable, ISNULL(ViewCount, 0) as ViewCount, ISNULL(AvgRating, 0) as AvgRating, ISNULL(ReviewCount, 0) as ReviewCount, CreatedAt FROM Products WHERE ProductID = @id AND IsAvailable = 1`);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const product = result.recordset[0];
        product.ImageUrl = product.Images ? `http://localhost:5000/uploads/${product.Images.split(',')[0]}` : null;
        product.AllImages = product.Images ? product.Images.split(',') : [];
        product.VideoUrl = product.VideoUrl ? `http://localhost:5000/uploads/${product.VideoUrl}` : null;
        
        res.status(200).json(product);
    } catch (error) {
        console.error('Error in getProduct:', error);
        res.status(500).json({ error: error.message });
    }
};

// Create product with single image
const createProduct = async (req, res) => {
    try {
        const { SellerID, ProductName, Description, Price, Category, Condition, Location } = req.body;
        const imageFile = req.file;
        
        const pool = await poolPromise;
        
        const imageName = imageFile ? imageFile.filename : null;
        
        const result = await pool.request()
            .input('SellerID', sql.Int, SellerID || 1)
            .input('ProductName', sql.NVarChar, ProductName)
            .input('Description', sql.NVarChar, Description || '')
            .input('Price', sql.Decimal(18, 2), Price)
            .input('Category', sql.NVarChar, Category || 'Other')
            .input('Condition', sql.NVarChar, Condition || 'Good')
            .input('Location', sql.NVarChar, Location || '')
            .input('Images', sql.NVarChar, imageName)
            .query(`
                INSERT INTO Products (SellerID, ProductName, Description, Price, Category, Condition, Location, Images, IsAvailable, CreatedAt, UpdatedAt)
                VALUES (@SellerID, @ProductName, @Description, @Price, @Category, @Condition, @Location, @Images, 1, GETDATE(), GETDATE());
                SELECT SCOPE_IDENTITY() AS ProductID;
            `);
        
        res.status(201).json({ 
            message: 'Product created successfully',
            productId: result.recordset[0].ProductID,
            imageUrl: imageName ? `http://localhost:5000/uploads/${imageName}` : null
        });
    } catch (error) {
        console.error('Error in createProduct:', error);
        res.status(500).json({ error: error.message });
    }
};

// Update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { ProductName, Description, Price, Category, Condition, Location } = req.body;
        const imageFile = req.file;
        
        const pool = await poolPromise;
        
        let imageName = null;
        if (imageFile) {
            imageName = imageFile.filename;
        } else {
            const existing = await pool.request()
                .input('id', sql.Int, id)
                .query('SELECT Images FROM Products WHERE ProductID = @id');
            if (existing.recordset.length > 0) {
                imageName = existing.recordset[0].Images;
            }
        }
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('ProductName', sql.NVarChar, ProductName)
            .input('Description', sql.NVarChar, Description)
            .input('Price', sql.Decimal(18, 2), Price)
            .input('Category', sql.NVarChar, Category)
            .input('Condition', sql.NVarChar, Condition)
            .input('Location', sql.NVarChar, Location)
            .input('Images', sql.NVarChar, imageName)
            .query(`
                UPDATE Products 
                SET ProductName = @ProductName,
                    Description = @Description,
                    Price = @Price,
                    Category = @Category,
                    Condition = @Condition,
                    Location = @Location,
                    Images = @Images,
                    UpdatedAt = GETDATE()
                WHERE ProductID = @id
            `);
        
        res.status(200).json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Error in updateProduct:', error);
        res.status(500).json({ error: error.message });
    }
};

// Delete product (soft delete)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.Int, id)
            .query(`UPDATE Products SET IsAvailable = 0 WHERE ProductID = @id`);
        
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        res.status(500).json({ error: error.message });
    }
};

// Increment view count
const incrementViewCount = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        
        await pool.request()
            .input('id', sql.Int, id)
            .query(`UPDATE Products SET ViewCount = ISNULL(ViewCount, 0) + 1 WHERE ProductID = @id`);
        
        res.status(200).json({ message: 'View count updated' });
    } catch (error) {
        console.error('Error in incrementViewCount:', error);
        res.status(500).json({ error: error.message });
    }
};

// Upload image for existing product
const uploadProductImage = async (req, res) => {
    try {
        const { id } = req.params;
        const imageFile = req.file;
        
        if (!imageFile) {
            return res.status(400).json({ message: 'No image file provided' });
        }
        
        const pool = await poolPromise;
        
        const product = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM Products WHERE ProductID = @id');
        
        if (product.recordset.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const existingImages = product.recordset[0].Images;
        let newImages = existingImages ? existingImages + ',' + imageFile.filename : imageFile.filename;
        
        await pool.request()
            .input('id', sql.Int, id)
            .input('Images', sql.NVarChar, newImages)
            .query('UPDATE Products SET Images = @Images WHERE ProductID = @id');
        
        res.json({ 
            message: 'Image uploaded successfully', 
            imageUrl: `http://localhost:5000/uploads/${imageFile.filename}`
        });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// Create product with multiple images and video
const createProductWithMedia = async (req, res) => {
    try {
        console.log('===== CREATE PRODUCT WITH MEDIA =====');
        console.log('Files (images):', req.files ? req.files.length : 0);
        console.log('Video file:', req.file ? req.file.filename : 'No video');
        console.log('Body:', req.body);
        
        const { SellerID, ProductName, Description, Price, Category, Condition, Location } = req.body;
        
        if (!ProductName || !Price) {
            return res.status(400).json({ message: 'Product Name and Price are required' });
        }
        
        const imageFiles = req.files;
        const videoFile = req.file;
        
        const imageNames = imageFiles && imageFiles.length > 0 
            ? imageFiles.map(f => f.filename).join(',') 
            : null;
        const videoName = videoFile ? videoFile.filename : null;
        
        const pool = await poolPromise;
        
        const result = await pool.request()
            .input('SellerID', sql.Int, SellerID || 1)
            .input('ProductName', sql.NVarChar, ProductName)
            .input('Description', sql.NVarChar, Description || '')
            .input('Price', sql.Decimal(18, 2), Price)
            .input('Category', sql.NVarChar, Category || 'Other')
            .input('Condition', sql.NVarChar, Condition || 'Good')
            .input('Location', sql.NVarChar, Location || '')
            .input('Images', sql.NVarChar, imageNames)
            .input('VideoUrl', sql.NVarChar, videoName)
            .query(`
                INSERT INTO Products (SellerID, ProductName, Description, Price, Category, Condition, Location, Images, VideoUrl, IsAvailable, CreatedAt, UpdatedAt)
                VALUES (@SellerID, @ProductName, @Description, @Price, @Category, @Condition, @Location, @Images, @VideoUrl, 1, GETDATE(), GETDATE());
                SELECT SCOPE_IDENTITY() AS ProductID;
            `);
        
        console.log('Product created successfully, ID:', result.recordset[0].ProductID);
        
        res.status(201).json({ 
            message: 'Product created successfully',
            productId: result.recordset[0].ProductID,
            images: imageNames,
            video: videoName
        });
    } catch (error) {
        console.error('Error in createProductWithMedia:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    createProductWithMedia,
    updateProduct,
    deleteProduct,
    incrementViewCount,
    uploadProductImage
};