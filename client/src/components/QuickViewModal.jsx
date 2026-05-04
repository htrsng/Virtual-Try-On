import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiHeart, FiShoppingCart, FiRepeat } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useWishlist } from '../contexts/WishlistContext';
import { useCompare } from '../contexts/CompareContext';

const DEFAULT_SIZE_OPTIONS = ['S', 'M', 'L', 'XL'];

const normalizeProductVariants = (product) => {
    const rawVariants = Array.isArray(product?.variants) ? product.variants : [];

    if (rawVariants.length > 0) {
        return rawVariants.map((variant) => ({
            colorName: variant?.color?.name || variant?.name || variant?.color || 'Mặc định',
            colorHex: variant?.color?.hex || variant?.hex || '#ffffff',
            colorImage: variant?.color?.image || variant?.image || variant?.img || '',
            sizes: Array.isArray(variant?.sizes) && variant.sizes.length > 0
                ? variant.sizes.map((size) => ({
                    size: size?.size || size?.label || 'M',
                    stock: Number(size?.stock) || 0,
                    sku: size?.sku || ''
                }))
                : DEFAULT_SIZE_OPTIONS.map((size, index) => ({
                    size,
                    stock: index === 1 ? Number(product?.totalStock ?? product?.stock) || 0 : 0,
                    sku: ''
                }))
        }));
    }

    if (product?.color || product?.hex || product?.img) {
        return [{
            colorName: product?.color || 'Mặc định',
            colorHex: product?.hex || '#ffffff',
            colorImage: product?.img || '',
            sizes: DEFAULT_SIZE_OPTIONS.map((size, index) => ({
                size,
                stock: index === 1 ? Number(product?.totalStock ?? product?.stock) || 0 : 0,
                sku: ''
            }))
        }];
    }

    return [];
};

function QuickViewModal({ product, onClose }) {
    const navigate = useNavigate();
    const { addToWishlist, isInWishlist } = useWishlist();
    const { addToCompare, isInCompare } = useCompare();
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedSize, setSelectedSize] = useState('');

    if (!product) return null;

    const productVariants = normalizeProductVariants(product);
    const activeVariant = selectedVariant || productVariants[0] || null;
    const sizes = activeVariant?.sizes?.length > 0
        ? activeVariant.sizes
        : DEFAULT_SIZE_OPTIONS.map((size, index) => ({
            size,
            stock: index === 1 ? Number(product?.totalStock ?? product?.stock) || 0 : 0,
            sku: ''
        }));
    const totalStock = sizes.reduce((total, size) => total + (Number(size.stock) || 0), 0);

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

    const currentImage = activeVariant?.colorImage || product.img;

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
                                src={currentImage}
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
                                <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                                    Còn lại: <strong>{totalStock}</strong> sản phẩm
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
                            {productVariants.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>
                                        Chọn màu:
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                        {productVariants.map((variant) => (
                                            <button
                                                key={`${variant.colorName}-${variant.colorHex}`}
                                                onClick={() => {
                                                    setSelectedVariant(variant);
                                                    setSelectedSize('');
                                                }}
                                                style={{
                                                    padding: '10px 14px',
                                                    border: activeVariant?.colorName === variant.colorName && activeVariant?.colorHex === variant.colorHex ? '2px solid #ee4d2d' : '1px solid #e5e7eb',
                                                    background: '#fff',
                                                    color: '#666',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}
                                            >
                                                {variant.colorImage ? (
                                                    <img src={variant.colorImage} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: variant.colorHex, border: '1px solid rgba(0,0,0,0.08)' }} />
                                                )}
                                                {variant.colorName}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '12px' }}>
                                    Chọn size:
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {sizes.map((size) => (
                                        <button
                                            key={size.size}
                                            onClick={() => setSelectedSize(size.size)}
                                            style={{
                                                padding: '10px 20px',
                                                border: selectedSize === size.size ? '2px solid #ee4d2d' : '1px solid #e5e7eb',
                                                background: selectedSize === size.size ? '#fff5f5' : '#fff',
                                                color: selectedSize === size.size ? '#ee4d2d' : '#666',
                                                borderRadius: '4px',
                                                cursor: (Number(size.stock) || 0) > 0 ? 'pointer' : 'not-allowed',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                transition: 'all 0.2s',
                                                minWidth: '60px',
                                                opacity: (Number(size.stock) || 0) > 0 ? 1 : 0.45
                                            }}
                                            disabled={(Number(size.stock) || 0) <= 0}
                                        >
                                            {size.size}
                                            <span style={{ display: 'block', marginTop: '4px', fontSize: '11px' }}>
                                                {(Number(size.stock) || 0) > 0 ? `Còn ${size.stock}` : 'Hết hàng'}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280' }}>
                                    {selectedSize ? `Size ${selectedSize} còn ${sizes.find((size) => size.size === selectedSize)?.stock || 0} sản phẩm` : 'Chọn size để xem số lượng còn lại.'}
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
