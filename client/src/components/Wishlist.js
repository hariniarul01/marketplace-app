import React, { useEffect, useState } from 'react';
import API from '../services/api';

function Wishlist({ wishlistItems, products, onRemoveFromWishlist, onBack }) {
    const [wishlistProducts, setWishlistProducts] = useState([]);

    useEffect(() => {
        const filtered = products.filter(product => wishlistItems.includes(product.ProductID));
        setWishlistProducts(filtered);
    }, [wishlistItems, products]);

    const handleRemove = (productId) => {
        onRemoveFromWishlist(productId);
    };

    const handleProductClick = (product) => {
        window.location.href = `/product/${product.ProductID}`;
    };

    return (
        <div className="container mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 style={{ color: '#2c3e50' }}>❤️ My Wishlist</h1>
                <button className="btn btn-secondary" onClick={onBack}>
                    ← Back to Marketplace
                </button>
            </div>

            {wishlistProducts.length === 0 ? (
                <div className="alert alert-info text-center">
                    Your wishlist is empty. Click the heart icon on products to add them here!
                </div>
            ) : (
                <div className="row">
                    {wishlistProducts.map((product) => (
                        <div className="col-md-4 mb-4" key={product.ProductID}>
                            <div className="card h-100 shadow-sm">
                                {product.ImageUrl ? (
                                    <img 
                                        src={product.ImageUrl} 
                                        className="card-img-top" 
                                        alt={product.ProductName}
                                        style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                                        onClick={() => handleProductClick(product)}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/300x200?text=No+Image'}
                                    />
                                ) : (
                                    <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '200px', cursor: 'pointer' }} onClick={() => handleProductClick(product)}>
                                        <span className="text-muted">No Image</span>
                                    </div>
                                )}
                                <div className="card-body">
                                    <h5 className="card-title text-primary" style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => handleProductClick(product)}>
                                        {product.ProductName}
                                    </h5>
                                    <p className="card-text text-muted">{product.Description?.substring(0, 80)}{product.Description?.length > 80 ? '...' : ''}</p>
                                    <h4 className="text-success">₹{product.Price?.toLocaleString()}</h4>
                                    <div className="mt-2">
                                        {product.Category && <span className="badge bg-secondary me-1">{product.Category}</span>}
                                        {product.Condition && <span className="badge bg-info">{product.Condition}</span>}
                                    </div>
                                    <p className="mt-2 mb-0">
                                        <small className="text-muted">📍 {product.Location || 'Location not specified'} | 👁️ {product.ViewCount || 0} views</small>
                                    </p>
                                    <button 
                                        className="btn btn-danger btn-sm mt-3 w-100" 
                                        onClick={() => handleRemove(product.ProductID)}
                                    >
                                        Remove from Wishlist
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Wishlist;