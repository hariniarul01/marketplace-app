USE LoginSystem;
GO

-- Complete order details with customer info
SELECT 
    o.OrderID,
    o.OrderDate,
    o.TotalAmount,
    o.PaymentStatus,
    o.OrderStatus,
    o.ShippingAddress,
    o.PaymentMethod,
    p.ProductName,
    oi.Quantity,
    oi.Price,
    (oi.Quantity * oi.Price) as ItemTotal
FROM Orders o
JOIN OrderItems oi ON o.OrderID = oi.OrderID
JOIN Products p ON oi.ProductID = p.ProductID
ORDER BY o.OrderDate DESC;
GO