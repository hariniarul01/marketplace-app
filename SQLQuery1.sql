USE LoginSystem;
GO

-- Drop existing tables if they exist (in correct order)
IF OBJECT_ID('Feedback', 'U') IS NOT NULL DROP TABLE Feedback;
IF OBJECT_ID('OrderItems', 'U') IS NOT NULL DROP TABLE OrderItems;
IF OBJECT_ID('Payments', 'U') IS NOT NULL DROP TABLE Payments;
IF OBJECT_ID('Orders', 'U') IS NOT NULL DROP TABLE Orders;
IF OBJECT_ID('Cart', 'U') IS NOT NULL DROP TABLE Cart;
IF OBJECT_ID('Searches', 'U') IS NOT NULL DROP TABLE Searches;
IF OBJECT_ID('Products', 'U') IS NOT NULL DROP TABLE Products;
GO

PRINT 'Creating Products table...';
CREATE TABLE Products (
    ProductID INT PRIMARY KEY IDENTITY(1,1),
    SellerID INT,
    ProductName NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX),
    Price DECIMAL(18,2) NOT NULL,
    Category NVARCHAR(100),
    Condition NVARCHAR(50),
    Images NVARCHAR(MAX),
    Location NVARCHAR(200),
    IsAvailable BIT DEFAULT 1,
    ViewCount INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedAt DATETIME DEFAULT GETDATE()
);
PRINT 'Products table created successfully!';
GO

PRINT 'Creating Cart table...';
CREATE TABLE Cart (
    CartID INT PRIMARY KEY IDENTITY(1,1),
    BuyerID INT,
    ProductID INT,
    Quantity INT DEFAULT 1,
    AddedAt DATETIME DEFAULT GETDATE()
);
PRINT 'Cart table created successfully!';
GO

PRINT 'Creating Orders table...';
CREATE TABLE Orders (
    OrderID INT PRIMARY KEY IDENTITY(1,1),
    BuyerID INT,
    OrderDate DATETIME DEFAULT GETDATE(),
    TotalAmount DECIMAL(18,2) NOT NULL,
    PaymentStatus NVARCHAR(50) DEFAULT 'Pending',
    OrderStatus NVARCHAR(50) DEFAULT 'Processing',
    ShippingAddress NVARCHAR(500),
    PaymentMethod NVARCHAR(50)
);
PRINT 'Orders table created successfully!';
GO

PRINT 'Creating OrderItems table...';
CREATE TABLE OrderItems (
    OrderItemID INT PRIMARY KEY IDENTITY(1,1),
    OrderID INT,
    ProductID INT,
    Quantity INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL
);
PRINT 'OrderItems table created successfully!';
GO

PRINT 'Creating Payments table...';
CREATE TABLE Payments (
    PaymentID INT PRIMARY KEY IDENTITY(1,1),
    OrderID INT,
    PaymentDate DATETIME DEFAULT GETDATE(),
    Amount DECIMAL(18,2) NOT NULL,
    TransactionID NVARCHAR(200),
    PaymentMethod NVARCHAR(50),
    PaymentStatus NVARCHAR(50)
);
PRINT 'Payments table created successfully!';
GO

PRINT 'Creating Feedback table...';
CREATE TABLE Feedback (
    FeedbackID INT PRIMARY KEY IDENTITY(1,1),
    ProductID INT,
    BuyerID INT,
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Comment NVARCHAR(500),
    CreatedAt DATETIME DEFAULT GETDATE()
);
PRINT 'Feedback table created successfully!';
GO

PRINT 'Creating Searches table...';
CREATE TABLE Searches (
    SearchID INT PRIMARY KEY IDENTITY(1,1),
    UserID INT,
    SearchTerm NVARCHAR(200),
    SearchDate DATETIME DEFAULT GETDATE()
);
PRINT 'Searches table created successfully!';
GO

-- Add foreign key constraints
PRINT 'Adding foreign key constraints...';

IF EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    ALTER TABLE Products ADD CONSTRAINT FK_Products_Users FOREIGN KEY (SellerID) REFERENCES Users(UserID);
    ALTER TABLE Cart ADD CONSTRAINT FK_Cart_Users FOREIGN KEY (BuyerID) REFERENCES Users(UserID);
    ALTER TABLE Cart ADD CONSTRAINT FK_Cart_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID);
    ALTER TABLE Orders ADD CONSTRAINT FK_Orders_Users FOREIGN KEY (BuyerID) REFERENCES Users(UserID);
    ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID);
    ALTER TABLE OrderItems ADD CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID);
    ALTER TABLE Payments ADD CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderID) REFERENCES Orders(OrderID);
    ALTER TABLE Feedback ADD CONSTRAINT FK_Feedback_Products FOREIGN KEY (ProductID) REFERENCES Products(ProductID);
    ALTER TABLE Feedback ADD CONSTRAINT FK_Feedback_Users FOREIGN KEY (BuyerID) REFERENCES Users(UserID);
    ALTER TABLE Searches ADD CONSTRAINT FK_Searches_Users FOREIGN KEY (UserID) REFERENCES Users(UserID);
    PRINT 'Foreign key constraints added successfully!';
END
ELSE
BEGIN
    PRINT 'Warning: Users table not found. Please create Users table first or skip foreign keys.';
END
GO

-- Insert sample data
PRINT 'Inserting sample data...';

INSERT INTO Products (SellerID, ProductName, Description, Price, Category, Condition, Location)
VALUES 
    (NULL, 'iPhone 14 Pro', 'Excellent condition, 256GB, Battery health 95%', 85000, 'Electronics', 'Like New', 'Mumbai'),
    (NULL, 'Sony WH-1000XM4', 'Wireless noise cancelling headphones', 15000, 'Electronics', 'New', 'Delhi'),
    (NULL, 'Wooden Dining Table', 'Solid teak wood, 6 seater', 12000, 'Furniture', 'Good', 'Bangalore'),
    (NULL, 'Mountain Bike', '21 gear, Disc brake, Excellent condition', 18000, 'Sports', 'Good', 'Pune'),
    (NULL, 'Samsung 55" TV', '4K Ultra HD Smart TV', 55000, 'Electronics', 'Like New', 'Chennai');
PRINT 'Sample data inserted successfully!';
GO

-- Verify all tables created
PRINT 'Verifying table creation...';
SELECT 
    TABLE_NAME,
    'Created' AS Status
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE' 
AND TABLE_NAME IN ('Products', 'Cart', 'Orders', 'OrderItems', 'Payments', 'Feedback', 'Searches')
ORDER BY TABLE_NAME;
GO

-- Show sample products
PRINT 'Sample products in database:';
SELECT 
    ProductID,
    ProductName,
    Price,
    Category,
    Condition,
    Location,
    IsAvailable,
    CreatedAt
FROM Products;
GO

PRINT 'DATABASE SETUP COMPLETE! All tables created successfully.';
GO