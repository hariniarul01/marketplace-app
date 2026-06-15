USE LoginSystem;
GO

-- See all products
SELECT * FROM Products;
GO

-- See only available products
SELECT ProductID, ProductName, Price, Category, Condition, Location 
FROM Products 
WHERE IsAvailable = 1;
GO