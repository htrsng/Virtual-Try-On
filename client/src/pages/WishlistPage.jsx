import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiShoppingCart, FiRepeat } from 'react-icons/fi';
import { useWishlist } from '../contexts/WishlistContext';
import { useCompare } from '../contexts/CompareContext';

function WishlistPage() {
    const navigate = useNavigate();
    const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
    const { addToCompare, isInCompare } = useCompare();

    const handleRemove = (productId) => {
        removeFromWishlist(productId);
    };

    const handleAddToCompare = (product) => {
        addToCompare(product);
    };

    const handleViewProduct = (productId) => {
        navigate(`/product/${productId}`);
    };

    if (wishlist.length === 0) {
        return (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>❤️</div>
                <h2 style={{ marginBottom: '16px', color: '#333' }}>Danh sách yêu thích trống</h2>
                <p style={{ color: '#666', marginBottom: '32px' }}>
                    Bạn chưa có sản phẩm nào trong danh sách yêu thích
                </p>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '12px 32px',
                        background: 'linear-gradient(135deg, #ff7a59 0%, #ff3d2e 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    Khám phá sản phẩm
                </button>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '40px 20px', minHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#333' }}>
                    Danh sách yêu thích ({wishlist.length})
                </h1>
                {wishlist.length > 0 && (
                    <button
                        onClick={clearWishlist}
                        style={{
                            padding: '10px 20px',
                            background: '#fff',
                            color: '#ef4444',
                            border: '1px solid #ef4444',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#ef4444';
                            e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#fff';
                            e.target.style.color = '#ef4444';
                        }}
                    >
                        Xóa tất cả
                    </button>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '24px'
            }}>
                {wishlist.map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                            background: '#fff',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px)';
                            e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.12)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
                        }}
                    >
                        <div
                            onClick={() => handleViewProduct(product.id)}
                            style={{
                                height: '240px',
                                background: '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '16px'
                            }}
                        >
                            <img
                                src={product.img}
                                alt={product.name}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain'
                                }}
                            />
                        </div>
                        <div style={{ padding: '16px' }}>
                            <h3 style={{
                                fontSize: '15px',
                                fontWeight: '600',
                                color: '#222',
                                marginBottom: '8px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                minHeight: '42px'
                            }}>
                                {product.name}
                            </h3>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#ef4444',
                                marginBottom: '12px'
                            }}>
                                {typeof product.price === 'number'
                                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)
                                    : product.price
                                }
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewProduct(product.id);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        background: '#ee4d2d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#d73211'}
                                    onMouseLeave={(e) => e.target.style.background = '#ee4d2d'}
                                >
                                    <FiShoppingCart size={16} />
                                    Mua
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToCompare(product);
                                    }}
                                    disabled={isInCompare(product.id)}
                                    style={{
                                        padding: '10px',
                                        background: isInCompare(product.id) ? '#e0e0e0' : '#fff',
                                        color: isInCompare(product.id) ? '#999' : '#ee4d2d',
                                        border: '1px solid ' + (isInCompare(product.id) ? '#e0e0e0' : '#ee4d2d'),
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        cursor: isInCompare(product.id) ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    title={isInCompare(product.id) ? 'Đã thêm vào so sánh' : 'So sánh'}
                                >
                                    <FiRepeat size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemove(product.id);
                                    }}
                                    style={{
                                        padding: '10px',
                                        background: '#fff',
                                        color: '#ef4444',
                                        border: '1px solid #ef4444',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#ef4444';
                                        e.target.style.color = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = '#fff';
                                        e.target.style.color = '#ef4444';
                                    }}
                                    title="Xóa khỏi yêu thích"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export default WishlistPage;
