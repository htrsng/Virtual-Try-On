import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiHeart, FiShoppingCart, FiRepeat } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCompare } from '../contexts/CompareContext';

function QuickViewModal({ product, onClose }) {
    const navigate = useNavigate();
    const { addToWishlist, isInWishlist } = useWishlist();
    const { addToCompare, isInCompare } = useCompare();
    const [selectedSize, setSelectedSize] = useState('');

    if (!product) return null;

    const sizes = product.sizes || ['S', 'M', 'L', 'XL'];

    const handleAddToWishlist = () => {
        addToWishlist(product);
    };

    const handleAddToCompare = () => {
        addToCompare(product);
    };

    const handleViewFullDetails = () => {
        navigate(`/product/${product.id}`);
        onClose();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: '#fff',
                        borderRadius: '16px',
                        maxWidth: '900px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        position: 'relative',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '16px',
                            right: '16px',
                            background: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = '#fff';
                        }}
                    >
                        <FiX size={20} />
                    </button>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', padding: '32px' }}>
                        {/* Image Section */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', borderRadius: '12px', padding: '24px' }}>
                            <img
                                src={product.img}
                                alt={product.name}
                                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                            />
                        </div>

                        {/* Product Info Section */}
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#222', marginBottom: '12px' }}>
                                {product.name}
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <span style={{ color: '#fbbf24', fontSize: '16px' }}>⭐⭐⭐⭐⭐</span>
                                <span style={{ color: '#666', fontSize: '14px' }}>
                                    Đã bán {product.sold || 0}
                                </span>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '32px', fontWeight: '700', color: '#ef4444', marginBottom: '8px' }}>
                                    {typeof product.price === 'number'
                                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)
                                        : product.price
                                    }
                                </div>
                                {product.oldPrice && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ fontSize: '18px', color: '#999', textDecoration: 'line-through' }}>
                                            {product.oldPrice}
                                        </span>
                                        {product.discount && (
                                            <span style={{ padding: '4px 8px', background: '#fee', color: '#ef4444', borderRadius: '4px', fontSize: '14px', fontWeight: '600' }}>
                                                -{product.discount}%
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Size Selection */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>
                                    Chọn size:
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {sizes.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setSelectedSize(size)}
                                            style={{
                                                padding: '10px 20px',
                                                border: selectedSize === size ? '2px solid #ee4d2d' : '1px solid #e5e7eb',
                                                background: selectedSize === size ? '#fff5f5' : '#fff',
                                                color: selectedSize === size ? '#ee4d2d' : '#666',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                transition: 'all 0.2s',
                                                minWidth: '60px'
                                            }}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                                <button
                                    onClick={handleViewFullDetails}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        background: '#ee4d2d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#d73211'}
                                    onMouseLeave={(e) => e.target.style.background = '#ee4d2d'}
                                >
                                    <FiShoppingCart size={18} />
                                    Xem chi tiết
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleAddToWishlist}
                                    disabled={isInWishlist(product.id)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: isInWishlist(product.id) ? '#f3f4f6' : '#fff',
                                        color: isInWishlist(product.id) ? '#999' : '#ee4d2d',
                                        border: '1px solid ' + (isInWishlist(product.id) ? '#e5e7eb' : '#ee4d2d'),
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: isInWishlist(product.id) ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s'
                                    }}
                                    title={isInWishlist(product.id) ? 'Đã thêm vào yêu thích' : 'Thêm vào yêu thích'}
                                >
                                    <FiHeart size={16} fill={isInWishlist(product.id) ? '#999' : 'none'} />
                                    {isInWishlist(product.id) ? 'Đã yêu thích' : 'Yêu thích'}
                                </button>
                                <button
                                    onClick={handleAddToCompare}
                                    disabled={isInCompare(product.id)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: isInCompare(product.id) ? '#f3f4f6' : '#fff',
                                        color: isInCompare(product.id) ? '#999' : '#ee4d2d',
                                        border: '1px solid ' + (isInCompare(product.id) ? '#e5e7eb' : '#ee4d2d'),
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: isInCompare(product.id) ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'all 0.2s'
                                    }}
                                    title={isInCompare(product.id) ? 'Đã thêm vào so sánh' : 'Thêm vào so sánh'}
                                >
                                    <FiRepeat size={16} />
                                    {isInCompare(product.id) ? 'Đã so sánh' : 'So sánh'}
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export default QuickViewModal;
