USE LoginSystem;
GO
SELECT 
    ProductID,
    ProductName,
    Description,
    Price,
    Category,
    Condition,
    Location,
    IsAvailable,
    ViewCount,
    CreatedAt
FROM Products
ORDER BY ProductID DESC;  
GO