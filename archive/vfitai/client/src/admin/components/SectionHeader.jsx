import React from 'react';
import './SectionHeader.css';

/**
 * SectionHeader — page-level title with optional action
 */
export default function SectionHeader({ title, subtitle, action, children }) {
    return (
        <div className="sh">
            <div className="sh__left">
                <h1 className="sh__title">{title}</h1>
                {subtitle && <p className="sh__subtitle">{subtitle}</p>}
            </div>
            <div className="sh__right">
                {action || children}
            </div>
        </div>
    );
}
