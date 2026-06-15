import React from 'react';

function RatingStars({ rating, size = 20, onRatingChange, readonly = false }) {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <span
                key={i}
                onClick={() => !readonly && onRatingChange && onRatingChange(i)}
                style={{
                    cursor: readonly ? 'default' : 'pointer',
                    fontSize: size,
                    color: i <= rating ? '#ffc107' : '#e4e5e9',
                    marginRight: '5px',
                    display: 'inline-block'
                }}
            >
                ★
            </span>
        );
    }
    
    return <div style={{ display: 'flex', alignItems: 'center' }}>{stars}</div>;
}

export default RatingStars;