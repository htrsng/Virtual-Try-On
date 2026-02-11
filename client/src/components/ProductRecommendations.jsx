import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

function ProductRecommendations({ currentProductId, category, onBuy, title = "Có thể bạn sẽ thích" }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchRecommendations();
    }, [currentProductId, category]);

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (user?._id) params.append('userId', user._id);
            if (currentProductId) params.append('productId', currentProductId);
            if (category) params.append('category', category);
            params.append('limit', '8');

            const res = await axios.get(`${API_URL}/api/recommendations?${params.toString()}`);
            // Loại bỏ sản phẩm hiện tại
            const filtered = (res.data || []).filter(
                p => String(p.id || p._id) !== String(currentProductId)
            );
            setProducts(filtered.slice(0, 8));
        } catch (err) {
            console.error('Lỗi lấy gợi ý:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        if (typeof price === 'string') return price;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    if (loading) {
        return (
            <div style={{ padding: '20px 0' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', color: '#333' }}>
                    ✨ {title}
                </h3>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{
                            width: '200px', minWidth: '200px', height: '280px',
                            background: '#f0f0f0', borderRadius: '12px',
                            animation: 'shimmer 1.5s infinite',
                        }} />
                    ))}
                </div>
                <style>{`
                    @keyframes shimmer {
                        0% { opacity: 0.5; }
                        50% { opacity: 1; }
                        100% { opacity: 0.5; }
                    }
                `}</style>
            </div>
        );
    }

    if (products.length === 0) return null;

    return (
        <div style={{ padding: '24px 0' }}>
            <h3 style={{
                fontSize: '20px', fontWeight: 700, marginBottom: '16px',
                color: '#333', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
                ✨ {title}
            </h3>
            <div style={{
                display: 'flex',
                gap: '16px',
                overflowX: 'auto',
                paddingBottom: '8px',
                scrollbarWidth: 'thin',
            }}>
                {products.map((product) => (
                    <div
                        key={product._id || product.id}
                        style={{
                            width: '200px',
                            minWidth: '200px',
                            background: 'white',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                        }}
                        onClick={() => navigate(`/product/${product.id || product._id}`)}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = 'translateY(-4px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.08)';
                        }}
                    >
                        <div style={{
                            width: '100%',
                            height: '200px',
                            overflow: 'hidden',
                            position: 'relative',
                        }}>
                            <img
                                src={product.img}
                                alt={product.name}
                                loading="lazy"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transition: 'transform 0.3s',
                                }}
                                onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                                onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                            />
                            {product.category && (
                                <span style={{
                                    position: 'absolute',
                                    top: '8px', left: '8px',
                                    background: 'rgba(238, 77, 45, 0.9)',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                }}>{product.category}</span>
                            )}
                        </div>
                        <div style={{ padding: '12px' }}>
                            <div style={{
                                fontSize: '13px', fontWeight: 600, color: '#333',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>{product.name}</div>
                            <div style={{
                                fontSize: '15px', fontWeight: 700, color: '#ee4d2d', marginTop: '6px',
                            }}>{formatPrice(product.price)}</div>
                            {onBuy && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onBuy(product);
                                    }}
                                    style={{
                                        width: '100%', marginTop: '8px',
                                        padding: '6px', border: '1px solid #ee4d2d',
                                        borderRadius: '6px', background: 'white',
                                        color: '#ee4d2d', fontSize: '12px', fontWeight: 600,
                                        cursor: 'pointer', transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => {
                                        e.target.style.background = '#ee4d2d';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={e => {
                                        e.target.style.background = 'white';
                                        e.target.style.color = '#ee4d2d';
                                    }}
                                >🛒 Thêm vào giỏ</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ProductRecommendations;
