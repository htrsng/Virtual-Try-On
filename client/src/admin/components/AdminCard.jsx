import React from 'react';
import './AdminCard.css';

/**
 * AdminCard — generic card wrapper with optional header
 */
export default function AdminCard({ title, subtitle, action, children, className = '', noPadding = false }) {
    return (
        <div className={`acard ${noPadding ? 'acard--no-pad' : ''} ${className}`}>
            {(title || action) && (
                <div className="acard__header">
                    <div>
                        {title && <h3 className="acard__title">{title}</h3>}
                        {subtitle && <p className="acard__subtitle">{subtitle}</p>}
                    </div>
                    {action && <div className="acard__action">{action}</div>}
                </div>
            )}
            <div className={`acard__body ${noPadding ? 'acard__body--flush' : ''}`}>
                {children}
            </div>
        </div>
    );
}
