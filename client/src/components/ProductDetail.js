import React, { useEffect, useState } from 'react';
import API from '../services/api';
import Chat from './Chat';
import ProductReviews from './ProductReviews';
import RatingStars from './RatingStars';

function ProductDetail({ product, onBack, userId }) {
    const [productData, setProductData] = useState(product);
    const [loading, setLoading] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    
    // Parse images from comma-separated string
    const images = productData.AllImages || (productData.Images ? productData.Images.split(',') : []);
    
    // Check for video
    let videoFilename = null;
    if (productData.VideoUrl) {
        if (productData.VideoUrl.includes('/uploads/')) {
            videoFilename = productData.VideoUrl.split('/uploads/')[1];
        } else {
            videoFilename = productData.VideoUrl;
        }
    }
    const hasVideo = !!videoFilename;
    
    console.log('Images count:', images.length);
    console.log('Has Video:', hasVideo);

    useEffect(() => {
        incrementViewCount();
        fetchProductDetails();
    }, []);

    const fetchProductDetails = async () => {
        try {
            const response = await API.get(`/products/${product.ProductID}`);
            setProductData(response.data);
        } catch (error) {
            console.error('Error fetching product details:', error);
        }
    };

    const incrementViewCount = async () => {
        try {
            setLoading(true);
            await API.post(`/products/${product.ProductID}/view`);
            setLoading(false);
        } catch (error) {
            console.error('Error incrementing view count:', error);
            setLoading(false);
        }
    };

    const handleChatClick = () => {
        if (!userId) {
            setShowAuthModal(true);
            return;
        }
        setShowChat(true);
    };

    const handleReviewChange = () => {
        fetchProductDetails();
    };

    const isBuyer = userId && userId !== productData.SellerID;

    if (loading) {
        return (
            <div className="container mt-4">
                <button className="btn btn-secondary mb-4" onClick={onBack}>
                    ← Back to Products
                </button>
                <div className="text-center">Loading product details...</div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            {/* Login Required Modal */}
            {showAuthModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">🔐 Login Required</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAuthModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Please login or register to contact the seller.</p>
                                <div className="d-grid gap-2">
                                    <button className="btn btn-primary" onClick={() => setShowAuthModal(false)}>
                                        Login / Register
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button className="btn btn-secondary mb-4" onClick={onBack}>
                ← Back to Products
            </button>
            
            <div className="row">
                {/* Product Media Section */}
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            {/* VIDEO PLAYER - Show if video exists */}
                            {hasVideo && (
                                <div className="mb-4">
                                    <video 
                                        controls 
                                        className="img-fluid rounded"
                                        style={{ width: '100%', maxHeight: '400px' }}
                                        poster={images.length > 0 ? `http://localhost:5000/uploads/${images[0]}` : null}
                                    >
                                        <source src={`http://localhost:5000/uploads/${videoFilename}`} type="video/mp4" />
                                        <source src={`http://localhost:5000/uploads/${videoFilename}`} type="video/webm" />
                                        <source src={`http://localhost:5000/uploads/${videoFilename}`} type="video/quicktime" />
                                        Your browser does not support the video tag.
                                    </video>
                                    <div className="mt-2 text-center">
                                        <span className="badge bg-danger">📹 Product Video</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* MAIN IMAGE - Always show images if they exist */}
                            {images.length > 0 && (
                                <div className="mb-3">
                                    <img 
                                        src={`http://localhost:5000/uploads/${images[currentImageIndex]}`}
                                        className="img-fluid rounded"
                                        alt={productData.ProductName}
                                        style={{ maxHeight: hasVideo ? '300px' : '400px', width: '100%', objectFit: 'contain' }}
                                        onError={(e) => e.target.src = 'https://via.placeholder.com/400x300?text=No+Image'}
                                    />
                                </div>
                            )}
                            
                            {/* No Images Message */}
                            {images.length === 0 && !hasVideo && (
                                <div className="bg-light d-flex align-items-center justify-content-center rounded mb-3" style={{ height: '300px' }}>
                                    <span className="text-muted">No Media Available</span>
                                </div>
                            )}
                            
                            {/* IMAGE THUMBNAIL GALLERY */}
                            {images.length > 1 && (
                                <div className="d-flex gap-2 mt-2 flex-wrap">
                                    {images.map((img, idx) => (
                                        <img 
                                            key={idx}
                                            src={`http://localhost:5000/uploads/${img}`}
                                            className={`border rounded ${idx === currentImageIndex ? 'border-primary border-3' : ''}`}
                                            style={{ width: '60px', height: '60px', objectFit: 'cover', cursor: 'pointer' }}
                                            onClick={() => setCurrentImageIndex(idx)}
                                            alt={`Thumbnail ${idx + 1}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Product Details */}
                <div className="col-md-6">
                    <div className="card shadow-sm">
                        <div className="card-body">
                            <h1 className="card-title">{productData.ProductName}</h1>
                            
                            {/* Rating Display */}
                            <div className="d-flex align-items-center mb-2">
                                <RatingStars rating={Math.round(productData.AvgRating || 0)} size={20} readonly={true} />
                                <span className="ms-2 text-muted">
                                    ({productData.ReviewCount || 0} {productData.ReviewCount === 1 ? 'review' : 'reviews'})
                                </span>
                            </div>
                            
                            <h3 className="text-success">₹{productData.Price?.toLocaleString()}</h3>
                            
                            <div className="mt-3">
                                <span className="badge bg-secondary me-2">{productData.Category}</span>
                                <span className="badge bg-info">{productData.Condition}</span>
                            </div>
                            
                            <p className="mt-3">
                                <strong>📍 Location:</strong> {productData.Location || 'Not specified'}
                            </p>
                            
                            <p>
                                <strong>👁️ Views:</strong> {productData.ViewCount || 0}
                            </p>
                            
                            <p>
                                <strong>📅 Listed on:</strong> {new Date(productData.CreatedAt).toLocaleDateString('en-IN')}
                            </p>
                            
                            <hr />
                            
                            <h5>Description:</h5>
                            <p>{productData.Description || 'No description provided.'}</p>
                            
                            <hr />
                            
                            <button className="btn btn-primary btn-lg w-100" onClick={handleChatClick}>
                                💬 Contact Seller
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Reviews Section */}
            <ProductReviews 
                productId={productData.ProductID}
                userId={userId}
                isLoggedIn={!!userId}
                onReviewChange={handleReviewChange}
            />
            
            {showChat && userId && (
                <Chat 
                    product={{...productData, BuyerID: userId, SellerID: productData.SellerID}}
                    userId={userId}
                    onClose={() => setShowChat(false)}
                />
            )}
        </div>
    );
}

export default ProductDetail;