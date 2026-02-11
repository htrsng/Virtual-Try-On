import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function ProductReviews({ productId }) {
    const [reviews, setReviews] = useState([]);
    const [avgRating, setAvgRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { user, isAuthenticated } = useAuth();

    useEffect(() => {
        if (productId) fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const res = await axios.get(`${API_URL}/api/reviews/${productId}`);
            setReviews(res.data.reviews || []);
            setAvgRating(res.data.avgRating || 0);
            setTotalReviews(res.data.totalReviews || 0);
        } catch (err) {
            console.error('Lỗi lấy đánh giá:', err);
        }
    };

    const submitReview = async () => {
        if (!isAuthenticated) {
            setError('Vui lòng đăng nhập để đánh giá');
            return;
        }
        if (!comment.trim()) {
            setError('Vui lòng nhập nhận xét');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await axios.post(`${API_URL}/api/reviews`, {
                productId,
                rating,
                comment,
            });
            setShowForm(false);
            setComment('');
            setRating(5);
            fetchReviews();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    const likeReview = async (reviewId) => {
        try {
            await axios.post(`${API_URL}/api/reviews/${reviewId}/like`);
            fetchReviews();
        } catch (err) {
            console.error('Lỗi like:', err);
        }
    };

    const renderStars = (count, size = 16, interactive = false) => {
        return (
            <div style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                    <span
                        key={i}
                        onClick={() => interactive && setRating(i)}
                        onMouseEnter={() => interactive && setHoverRating(i)}
                        onMouseLeave={() => interactive && setHoverRating(0)}
                        style={{
                            fontSize: `${size}px`,
                            cursor: interactive ? 'pointer' : 'default',
                            color: i <= (interactive ? (hoverRating || rating) : count) ? '#ffc107' : '#ddd',
                            transition: 'transform 0.1s',
                        }}
                    >★</span>
                ))}
            </div>
        );
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length,
        percent: totalReviews > 0 ? (reviews.filter(r => r.rating === star).length / totalReviews * 100) : 0,
    }));

    return (
        <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginTop: '24px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', color: '#333' }}>
                ⭐ Đánh giá sản phẩm ({totalReviews})
            </h3>

            {/* Rating Summary */}
            <div style={{
                display: 'flex', gap: '32px', padding: '20px',
                background: '#fef9f5', borderRadius: '12px', marginBottom: '20px',
                flexWrap: 'wrap',
            }}>
                {/* Average */}
                <div style={{ textAlign: 'center', minWidth: '120px' }}>
                    <div style={{ fontSize: '48px', fontWeight: 700, color: '#ee4d2d' }}>
                        {avgRating > 0 ? avgRating : '--'}
                    </div>
                    {renderStars(Math.round(avgRating), 20)}
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                        {totalReviews} đánh giá
                    </div>
                </div>

                {/* Distribution */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    {ratingDistribution.map(({ star, count, percent }) => (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', color: '#666', width: '50px' }}>{star} sao</span>
                            <div style={{
                                flex: 1, height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%', background: '#ffc107', borderRadius: '4px',
                                    width: `${percent}%`, transition: 'width 0.5s ease',
                                }} />
                            </div>
                            <span style={{ fontSize: '13px', color: '#666', width: '30px' }}>{count}</span>
                        </div>
                    ))}
                </div>

                {/* Write Review Button */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        style={{
                            padding: '12px 24px', background: '#ee4d2d', color: 'white',
                            border: 'none', borderRadius: '8px', fontWeight: 600,
                            fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                        onMouseEnter={e => e.target.style.background = '#d63e22'}
                        onMouseLeave={e => e.target.style.background = '#ee4d2d'}
                    >✍️ Viết đánh giá</button>
                </div>
            </div>

            {/* Review Form */}
            {showForm && (
                <div style={{
                    padding: '20px', background: '#f9f9f9', borderRadius: '12px',
                    marginBottom: '20px', border: '1px solid #eee',
                }}>
                    <h4 style={{ marginBottom: '12px', color: '#333' }}>Đánh giá của bạn</h4>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', color: '#666', marginBottom: '4px', display: 'block' }}>Số sao:</label>
                        {renderStars(rating, 28, true)}
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ fontSize: '14px', color: '#666', marginBottom: '4px', display: 'block' }}>Nhận xét:</label>
                        <textarea
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
                            style={{
                                width: '100%', minHeight: '100px', padding: '12px',
                                border: '1px solid #ddd', borderRadius: '8px',
                                fontSize: '14px', resize: 'vertical', fontFamily: 'inherit',
                            }}
                        />
                    </div>
                    {error && (
                        <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '8px' }}>
                            ⚠️ {error}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={submitReview}
                            disabled={submitting}
                            style={{
                                padding: '10px 20px', background: '#ee4d2d', color: 'white',
                                border: 'none', borderRadius: '8px', fontWeight: 600,
                                fontSize: '14px', cursor: submitting ? 'default' : 'pointer',
                                opacity: submitting ? 0.7 : 1,
                            }}
                        >{submitting ? '⏳ Đang gửi...' : '📤 Gửi đánh giá'}</button>
                        <button
                            onClick={() => { setShowForm(false); setError(''); }}
                            style={{
                                padding: '10px 20px', background: '#f0f0f0', color: '#666',
                                border: 'none', borderRadius: '8px', fontWeight: 600,
                                fontSize: '14px', cursor: 'pointer',
                            }}
                        >Hủy</button>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '40px', color: '#999',
                }}>
                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>📝</div>
                    <div>Chưa có đánh giá nào. Hãy là người đầu tiên!</div>
                </div>
            ) : (
                <div>
                    {reviews.map((review) => (
                        <div key={review._id} style={{
                            padding: '16px 0',
                            borderBottom: '1px solid #f0f0f0',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #ee4d2d, #ff6b35)',
                                        color: 'white', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontWeight: 700, fontSize: '16px',
                                    }}>{review.userName?.charAt(0)?.toUpperCase() || 'A'}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#333' }}>
                                            {review.userName}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                            {renderStars(review.rating, 14)}
                                            <span style={{ fontSize: '12px', color: '#999' }}>
                                                {formatDate(review.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                marginTop: '10px', marginLeft: '52px',
                                fontSize: '14px', color: '#555', lineHeight: '1.6',
                            }}>
                                {review.comment}
                            </div>
                            <div style={{
                                marginTop: '8px', marginLeft: '52px',
                                display: 'flex', gap: '16px',
                            }}>
                                <button
                                    onClick={() => likeReview(review._id)}
                                    style={{
                                        background: 'none', border: 'none', color: '#999',
                                        fontSize: '13px', cursor: 'pointer', display: 'flex',
                                        alignItems: 'center', gap: '4px',
                                    }}
                                >
                                    👍 Hữu ích ({review.likes || 0})
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProductReviews;
