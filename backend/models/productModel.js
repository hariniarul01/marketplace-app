const { sql, poolPromise } = require('../config/db');

const ProductModel = {
    // Get all products (with optional search)
    getAllProducts: async (search = null) => {
        try {
            const pool = await poolPromise;
            let query = `SELECT * FROM Products WHERE IsAvailable = 1`;
            
            if (search) {
                query += ` AND (ProductName LIKE '%${search}%' OR Description LIKE '%${search}%')`;
            }
            
            query += ` ORDER BY CreatedAt DESC`;
            
            const result = await pool.request().query(query);
            return result.recordset;
        } catch (error) {
            throw error;
        }
    },
    
    // Get single product by ID
    getProductById: async (id) => {
        try {
            const pool = await poolPromise;
            
            // Increment view count
            await pool.request()
                .input('id', sql.Int, id)
                .query(`UPDATE Products SET ViewCount = ViewCount + 1 WHERE ProductID = @id`);
            
            // Get product details
            const result = await pool.request()
                .input('id', sql.Int, id)
                .query(`SELECT * FROM Products WHERE ProductID = @id AND IsAvailable = 1`);
            
            return result.recordset[0];
        } catch (error) {
            throw error;
        }
    },
    
    // Create new product
    createProduct: async (product) => {
        try {
            const pool = await poolPromise;
            const result = await pool.request()
                .input('SellerID', sql.Int, product.SellerID || 1)
                .input('ProductName', sql.NVarChar, product.ProductName)
                .input('Description', sql.NVarChar, product.Description || '')
                .input('Price', sql.Decimal(18, 2), product.Price)
                .input('Category', sql.NVarChar, product.Category || 'Other')
                .input('Condition', sql.NVarChar, product.Condition || 'Good')
                .input('Images', sql.NVarChar, product.Images || '')
                .input('Location', sql.NVarChar, product.Location || '')
                .query(`
                    INSERT INTO Products (SellerID, ProductName, Description, Price, Category, Condition, Images, Location, IsAvailable, CreatedAt, UpdatedAt)
                    VALUES (@SellerID, @ProductName, @Description, @Price, @Category, @Condition, @Images, @Location, 1, GETDATE(), GETDATE());
                    SELECT SCOPE_IDENTITY() AS ProductID;
                `);
            
            return { ProductID: result.recordset[0].ProductID };
        } catch (error) {
            throw error;
        }
    },
    
    // Update product
    updateProduct: async (id, product) => {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .input('ProductName', sql.NVarChar, product.ProductName)
                .input('Description', sql.NVarChar, product.Description)
                .input('Price', sql.Decimal(18, 2), product.Price)
                .input('Category', sql.NVarChar, product.Category)
                .input('Condition', sql.NVarChar, product.Condition)
                .input('Location', sql.NVarChar, product.Location)
                .query(`
                    UPDATE Products 
                    SET ProductName = @ProductName,
                        Description = @Description,
                        Price = @Price,
                        Category = @Category,
                        Condition = @Condition,
                        Location = @Location,
                        UpdatedAt = GETDATE()
                    WHERE ProductID = @id
                `);
            
            return { message: 'Product updated successfully' };
        } catch (error) {
            throw error;
        }
    },
    
    // Delete product (soft delete)
    deleteProduct: async (id) => {
        try {
            const pool = await poolPromise;
            await pool.request()
                .input('id', sql.Int, id)
                .query(`UPDATE Products SET IsAvailable = 0 WHERE ProductID = @id`);
            
            return { message: 'Product deleted successfully' };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = ProductModel;