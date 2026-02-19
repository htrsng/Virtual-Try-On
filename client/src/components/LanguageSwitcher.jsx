import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const languages = [
        { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
        { code: 'en', name: 'English', flag: '🇺🇸' },
    ];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const currentLang = languages.find(l => l.code === language) || languages[0];

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="icon-btn"
                title="Chọn ngôn ngữ"
                style={{ gap: '6px' }}
            >
                <span>{currentLang.flag}</span>
                <span style={{ fontSize: '12px', fontWeight: 600 }}>{currentLang.code.toUpperCase()}</span>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0,
                    background: 'white', borderRadius: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    minWidth: '160px', zIndex: 1000,
                    overflow: 'hidden', marginTop: '4px',
                    animation: 'langDropdown 0.2s ease',
                }}>
                    {languages.map(lang => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            style={{
                                width: '100%', padding: '10px 16px',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: language === lang.code ? '#fff5f2' : 'white',
                                border: 'none', cursor: 'pointer', fontSize: '14px',
                                color: '#333', transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.target.style.background = '#f5f5f5'}
                            onMouseLeave={e => e.target.style.background = language === lang.code ? '#fff5f2' : 'white'}
                        >
                            <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                            <span style={{ fontWeight: language === lang.code ? 700 : 400 }}>{lang.name}</span>
                            {language === lang.code && <span style={{ marginLeft: 'auto', color: '#ee4d2d' }}>✓</span>}
                        </button>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes langDropdown {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default LanguageSwitcher;
