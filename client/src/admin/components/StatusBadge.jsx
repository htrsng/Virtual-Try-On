import React from 'react';
import './StatusBadge.css';

/**
 * StatusBadge — colored pill for order/product status
 *
 * @param {'processing'|'shipped'|'delivered'|'cancelled'|'active'|'inactive'|'draft'} variant
 */

const VARIANT_MAP = {
    // English
    processing: 'yellow',
    shipped: 'blue',
    delivered: 'green',
    cancelled: 'red',
    active: 'green',
    inactive: 'gray',
    draft: 'gray',
    // Vietnamese
    'đang xử lý': 'yellow',
    'đang giao': 'blue',
    'đã giao': 'green',
    'đã hủy': 'red',
    'hoạt động': 'green',
    'ngưng': 'gray',
};

export default function StatusBadge({ status, variant, children }) {
    const color = variant || VARIANT_MAP[status?.toLowerCase()] || 'gray';
    return (
        <span className={`sbadge sbadge--${color}`}>
            <span className="sbadge__dot" />
            {children || status}
        </span>
    );
}
