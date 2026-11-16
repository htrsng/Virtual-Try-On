import React from 'react';
import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import './StatCard.css';

/**
 * StatCard — premium metric card for dashboard
 *
 * Props:
 * - icon      Component — e.g. FiDollarSign
 * - label     string    — "Doanh thu hôm nay"
 * - value     string    — "2.400.000 ₫"
 * - trend     string    — "+12.5% so với hôm qua" or description
 * - trendUp   boolean   — true = green arrow, false = red arrow
 * - trendText string    — optional secondary text after trend
 * - color     string    — "primary" | "success" | "warning" | "danger" | "info" | "purple"
 * - variant   string    — alias for color (backward compat)
 */
export default function StatCard({ label, value, trend, trendUp, trendText, variant, color, icon: Icon }) {
    const c = color || variant || 'primary';
    const isUp = trendUp === true || trend?.startsWith('+');
    const isDown = trendUp === false && !trend?.startsWith('+');

    return (
        <div className={`scard scard--${c}`}>
            <div className="scard__icon-wrap">
                {Icon && (typeof Icon === 'function' ? <Icon size={22} /> : Icon)}
            </div>
            <div className="scard__body">
                <div className="scard__label">{label}</div>
                <div className="scard__value">{value}</div>
                {trend && (
                    <div className={`scard__trend ${isUp ? 'scard__trend--up' : ''} ${isDown ? 'scard__trend--down' : ''}`}>
                        {isUp && <FiArrowUp size={13} />}
                        {isDown && <FiArrowDown size={13} />}
                        <span>{trend}</span>
                        {trendText && <span className="scard__trend-text">{trendText}</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
