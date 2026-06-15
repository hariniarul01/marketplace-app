USE LoginSystem;
GO

-- See all items in cart
SELECT 
    c.CartID,
    c.BuyerID,
    c.ProductID,
    c.Quantity,
    c.AddedAt,
    p.ProductName,
    p.Price,
    (p.Price * c.Quantity) as TotalPrice
FROM Cart c
JOIN Products p ON c.ProductID = p.ProductID
ORDER BY c.AddedAt DESC;
GO