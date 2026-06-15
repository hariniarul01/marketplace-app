import React, { useEffect, useState } from 'react';
import API from '../services/api';
import RatingStars from './RatingStars';

function ProductReviews({ productId, userId, isLoggedIn, onReviewChange }) {
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [reviewCount, setReviewCount] = useState(0);
    const [userReview, setUserReview] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchReviews();
        if (isLoggedIn && userId) {
            checkUserReview();
        }
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const response = await API.get(`/reviews/product/${productId}`);
            setReviews(response.data);
            
            // Calculate average rating
            if (response.data.length > 0) {
                const total = response.data.reduce((sum, r) => sum + r.Rating, 0);
                setAvgRating((total / response.data.length).toFixed(1));
                setReviewCount(response.data.length);
            } else {
                setAvgRating(0);
                setReviewCount(0);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setLoading(false);
        }
    };

    const checkUserReview = async () => {
        try {
            const response = await API.get(`/reviews/check/${productId}/${userId}`);
            if (response.data.hasReviewed) {
                setUserReview(response.data.review);
                setRating(response.data.review.Rating);
                setComment(response.data.review.Comment || '');
            }
        } catch (error) {
            console.error('Error checking user review:', error);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            alert('Please select a rating');
            return;
        }
        
        setSubmitting(true);
        try {
            await API.post(`/reviews/product/${productId}`, {
                userId: userId,
                rating: rating,
                comment: comment
            });
            alert(userReview ? 'Review updated successfully!' : 'Review added successfully!');
            fetchReviews();
            checkUserReview();
            
            // Notify parent component to update product rating
            if (onReviewChange) {
                onReviewChange();
            }
            
            setSubmitting(false);
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review');
            setSubmitting(false);
        }
    };

    const handleDeleteReview = async () => {
        if (window.confirm('Are you sure you want to delete your review?')) {
            try {
                await API.delete(`/reviews/${userReview.ReviewID}`, {
                    data: { userId: userId }
                });
                alert('Review deleted successfully');
                setUserReview(null);
                setRating(0);
                setComment('');
                fetchReviews();
                
                if (onReviewChange) {
                    onReviewChange();
                }
            } catch (error) {
                console.error('Error deleting review:', error);
                alert('Failed to delete review');
            }
        }
    };

    if (loading) {
        return <div className="text-center py-3">Loading reviews...</div>;
    }

    return (
        <div className="mt-4" style={{ borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
            <h5 className="mb-3">⭐ Ratings & Reviews</h5>
            
            {/* Average Rating Summary */}
            <div className="d-flex align-items-center mb-4 p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                <div className="text-center me-4">
                    <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#ffc107' }}>{avgRating}</span>
                    <span style={{ fontSize: '20px', color: '#666' }}>/5</span>
                </div>
                <div>
                    <RatingStars rating={Math.round(avgRating)} size={24} readonly={true} />
                    <div className="text-muted mt-1">{reviewCount} customer review(s)</div>
                </div>
            </div>
            
            {/* Add/Edit Review Form */}
            {isLoggedIn ? (
                userReview ? (
                    <div className="card mb-4" style={{ borderRadius: '12px' }}>
                        <div className="card-body">
                            <h6 className="mb-3">✏️ Edit Your Review</h6>
                            <RatingStars rating={rating} size={28} onRatingChange={setRating} />
                            <textarea 
                                className="form-control mt-3" 
                                rows="3"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience with this product..."
                                style={{ borderRadius: '10px' }}
                            />
                            <div className="mt-3 d-flex gap-2">
                                <button 
                                    className="btn btn-primary" 
                                    onClick={handleSubmitReview}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : 'Update Review'}
                                </button>
                                <button 
                                    className="btn btn-outline-danger" 
                                    onClick={handleDeleteReview}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="card mb-4" style={{ borderRadius: '12px' }}>
                        <div className="card-body">
                            <h6 className="mb-3">📝 Write a Review</h6>
                            <RatingStars rating={rating} size={28} onRatingChange={setRating} />
                            <textarea 
                                className="form-control mt-3" 
                                rows="3"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience with this product..."
                                style={{ borderRadius: '10px' }}
                            />
                            <button 
                                className="btn btn-primary mt-3" 
                                onClick={handleSubmitReview}
                                disabled={submitting}
                            >
                                {submitting ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </div>
                    </div>
                )
            ) : (
                <div className="alert alert-info text-center">
                    🔐 <a href="#" onClick={(e) => { e.preventDefault(); window.location.href = '/login'; }}>Login</a> to write a review
                </div>
            )}
            
            {/* All Reviews List */}
            <div className="mt-4">
                <h6 className="mb-3">📋 All Reviews ({reviews.length})</h6>
                {reviews.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        No reviews yet. Be the first to review this product!
                    </div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.ReviewID} className="border-bottom pb-3 mb-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <strong>{review.UserName}</strong>
                                    <div className="mt-1">
                                        <RatingStars rating={review.Rating} size={16} readonly={true} />
                                    </div>
                                </div>
                                <small className="text-muted">
                                    {new Date(review.CreatedAt).toLocaleDateString('en-IN')}
                                </small>
                            </div>
                            {review.Comment && (
                                <p className="mt-2 mb-0 text-secondary">{review.Comment}</p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default ProductReviews;