import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function CartModal({ isOpen, onClose, cartItems, onRemove, onCheckout }) {
    const [selectedItems, setSelectedItems] = useState({});
    const { t } = useLanguage();

    // Initialize all items as selected when cart changes
    // Dùng cartId thay vì id vì cart có thể có cùng sản phẩm nhưng khác size
    useEffect(() => {
        const initialSelected = {};
        cartItems.forEach(item => {
            // Dùng cartId nếu có, fallback về id
            const key = item.cartId || item.id;
            initialSelected[key] = true;
        });
        setSelectedItems(initialSelected);
    }, [cartItems]);

    if (!isOpen) return null;

    const handleSelectItem = (itemId) => {
        setSelectedItems(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const handleSelectAll = () => {
        const allSelected = Object.values(selectedItems).every(val => val);
        const newSelected = {};
        cartItems.forEach(item => {
            const key = item.cartId || item.id;
            newSelected[key] = !allSelected;
        });
        setSelectedItems(newSelected);
    };

    const total = cartItems.reduce((sum, item) => {
        const key = item.cartId || item.id;
        if (selectedItems[key]) {
            const price = parseInt(item.price.replace(/\./g, '').replace(' đ', ''));
            return sum + price * item.quantity;
        }
        return sum;
    }, 0);

    const selectedCount = Object.values(selectedItems).filter(Boolean).length;
    const allSelected = selectedCount === cartItems.length && cartItems.length > 0;

    return (
        <div className="modal-overlay">
            <div className="modal-content large">
                <div className="modal-header">
                    <div className="modal-title">{t('your_cart')}</div>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    {cartItems.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            {t('empty_cart')}
                        </div>
                    ) : (
                        <>
                            <div style={{
                                padding: '10px 15px',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={handleSelectAll}
                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                />
                                <span style={{ fontWeight: '500' }}>{t('select_all')} ({cartItems.length} {t('products_unit')})</span>
                            </div>
                            {cartItems.map((item) => {
                                const key = item.cartId || item.id;
                                return (
                                    <div key={key} className="cart-item" style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        padding: '15px',
                                        borderBottom: '1px solid #f0f0f0',
                                        backgroundColor: selectedItems[key] ? '#fff' : '#f9f9f9'
                                    }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedItems[key] || false}
                                            onChange={() => handleSelectItem(key)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer', flexShrink: 0 }}
                                        />
                                        <div className="cart-item-info" style={{ flex: 1, display: 'flex', gap: '12px' }}>
                                            <img src={item.img} alt="" className="cart-img" style={{ flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{item.name}</div>
                                                <div style={{ color: '#888', fontSize: '12px', marginBottom: '5px' }}>{item.price}</div>
                                                <div style={{ fontSize: '14px', color: '#666' }}>{t('quantity_label')} {item.quantity}</div>
                                            </div>
                                        </div>
                                        <div className="cart-actions">
                                            <button
                                                style={{
                                                    color: 'red',
                                                    border: '1px solid #ffcdd2',
                                                    background: '#fff',
                                                    padding: '6px 12px',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px'
                                                }}
                                                onClick={() => onRemove(item.cartId || item.id)}
                                            >
                                                {t('delete')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="cart-total" style={{
                                padding: '20px 15px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderTop: '2px solid #eee'
                            }}>
                                <span>{t('total_payment')} ({selectedCount} {t('products_unit')}):</span>
                                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#e53935' }}>
                                    {total.toLocaleString('vi-VN')} đ
                                </span>
                            </div>
                            <button
                                className="checkout-btn"
                                onClick={() => {
                                    const selected = cartItems.filter(item => {
                                        const key = item.cartId || item.id;
                                        return selectedItems[key];
                                    });
                                    if (selected.length === 0) {
                                        alert(t('select_item_warning'));
                                        return;
                                    }
                                    onCheckout(selected);
                                }}
                                disabled={selectedCount === 0}
                                style={{ opacity: selectedCount === 0 ? 0.5 : 1 }}
                            >
                                {t('buy_items')} ({selectedCount})
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CartModal;