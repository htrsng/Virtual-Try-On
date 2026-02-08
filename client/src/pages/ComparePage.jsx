import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiX } from 'react-icons/fi';
import { useCompare } from '../contexts/CompareContext';

function ComparePage() {
    const navigate = useNavigate();
    const { compareList, removeFromCompare, clearCompare, maxCompare } = useCompare();

    if (compareList.length === 0) {
        return (
            <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '80px', marginBottom: '20px' }}>🔄</div>
                <h2 style={{ marginBottom: '16px', color: '#333' }}>Danh sách so sánh trống</h2>
                <p style={{ color: '#666', marginBottom: '32px' }}>
                    Bạn chưa thêm sản phẩm nào để so sánh
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

    const features = [
        { label: 'Hình ảnh', key: 'img', render: (product) => (
            <img src={product.img} alt={product.name} style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
        )},
        { label: 'Tên sản phẩm', key: 'name', render: (product) => product.name },
        { label: 'Giá', key: 'price', render: (product) => (
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#ef4444' }}>
                {typeof product.price === 'number'
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)
                    : product.price
                }
            </span>
        )},
        { label: 'Giảm giá', key: 'discount', render: (product) => product.discount ? `-${product.discount}%` : 'Không' },
        { label: 'Đã bán', key: 'sold', render: (product) => product.sold || 0 },
        { label: 'Đánh giá', key: 'rating', render: () => '⭐⭐⭐⭐⭐' }
    ];

    return (
        <div className="container" style={{ padding: '40px 20px', minHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>
                        So sánh sản phẩm ({compareList.length}/{maxCompare})
                    </h1>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        Tối đa {maxCompare} sản phẩm
                    </p>
                </div>
                {compareList.length > 0 && (
                    <button
                        onClick={clearCompare}
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

            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                    <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                            <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#333', borderBottom: '2px solid #e5e7eb' }}>
                                Thông tin
                            </th>
                            {compareList.map((product) => (
                                <th key={product.id} style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: '#333', borderBottom: '2px solid #e5e7eb', position: 'relative' }}>
                                    <button
                                        onClick={() => removeFromCompare(product.id)}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            background: '#fff',
                                            border: '1px solid #e5e7eb',
                                            borderRadius: '50%',
                                            width: '28px',
                                            height: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.target.style.background = '#ef4444';
                                            e.target.style.borderColor = '#ef4444';
                                            e.target.style.color = 'white';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.style.background = '#fff';
                                            e.target.style.borderColor = '#e5e7eb';
                                            e.target.style.color = '#666';
                                        }}
                                        title="Xóa"
                                    >
                                        <FiX size={16} />
                                    </button>
                                    Sản phẩm {compareList.indexOf(product) + 1}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {features.map((feature, idx) => (
                            <motion.tr
                                key={feature.key}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{ borderBottom: '1px solid #f0f0f0' }}
                            >
                                <td style={{ padding: '16px', fontWeight: '600', color: '#666', background: '#fafafa' }}>
                                    {feature.label}
                                </td>
                                {compareList.map((product) => (
                                    <td key={product.id} style={{ padding: '16px', textAlign: 'center', color: '#333' }}>
                                        {feature.render(product)}
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                        <tr>
                            <td style={{ padding: '16px', fontWeight: '600', color: '#666', background: '#fafafa' }}>
                                Hành động
                            </td>
                            {compareList.map((product) => (
                                <td key={product.id} style={{ padding: '16px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => navigate(`/product/${product.id}`)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 16px',
                                            background: '#ee4d2d',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = '#d73211'}
                                        onMouseLeave={(e) => e.target.style.background = '#ee4d2d'}
                                    >
                                        Xem chi tiết
                                    </button>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ComparePage;
