import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductList from '../components/ProductList';
import { FiSearch, FiX } from 'react-icons/fi';

function SearchResultsPage({ allProducts, onBuy, showToast }) {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const query = searchParams.get('q') || '';
    const [searchInput, setSearchInput] = useState(query);

    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    // Filter products based on search query
    const searchResults = allProducts.filter(product => {
        const searchLower = query.toLowerCase();
        return (
            product.name.toLowerCase().includes(searchLower) ||
            product.category?.toLowerCase().includes(searchLower)
        );
    });

    const handleNewSearch = () => {
        if (searchInput.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleNewSearch();
        }
    };

    const handleClearSearch = () => {
        setSearchInput('');
        navigate('/');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="search-results-page"
            style={{ minHeight: '80vh', paddingTop: '20px' }}
        >
            <div className="container">
                {/* Search Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        background: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '30px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                >
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: '600',
                        color: '#333',
                        marginBottom: '15px'
                    }}>
                        <FiSearch style={{ display: 'inline', marginRight: '10px' }} />
                        Kết quả tìm kiếm
                    </h1>

                    {/* New Search Box */}
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'center',
                        marginBottom: '15px'
                    }}>
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            background: '#f5f5f5',
                            borderRadius: '4px',
                            padding: '8px 12px'
                        }}>
                            <FiSearch style={{ color: '#999', marginRight: '8px' }} />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Tìm kiếm sản phẩm khác..."
                                style={{
                                    flex: 1,
                                    border: 'none',
                                    background: 'transparent',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                            {searchInput && (
                                <button
                                    onClick={() => setSearchInput('')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: '#999',
                                        padding: '4px'
                                    }}
                                >
                                    <FiX />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleNewSearch}
                            style={{
                                padding: '10px 24px',
                                background: '#ee4d2d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '14px'
                            }}
                        >
                            Tìm kiếm
                        </button>
                    </div>

                    {/* Search Stats */}
                    <div style={{
                        fontSize: '14px',
                        color: '#666',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <span>
                            {query && (
                                <>
                                    Tìm thấy <strong style={{ color: '#ee4d2d' }}>{searchResults.length}</strong> sản phẩm cho từ khóa "<strong>{query}</strong>"
                                </>
                            )}
                            {!query && 'Nhập từ khóa để tìm kiếm sản phẩm'}
                        </span>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                background: 'none',
                                border: '1px solid #ddd',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                color: '#666'
                            }}
                        >
                            Về trang chủ
                        </button>
                    </div>
                </motion.div>

                {/* Search Results */}
                {query && searchResults.length > 0 ? (
                    <ProductList
                        products={searchResults}
                        title={`KẾT QUẢ TÌM KIẾM CHO "${query.toUpperCase()}"`}
                        onBuy={onBuy}
                        loading={false}
                    />
                ) : query && searchResults.length === 0 ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
                        <h3 style={{ fontSize: '20px', color: '#333', marginBottom: '10px' }}>
                            Không tìm thấy sản phẩm nào
                        </h3>
                        <p style={{ color: '#666', marginBottom: '20px' }}>
                            Không có kết quả nào cho từ khóa "<strong>{query}</strong>"
                        </p>
                        <button
                            onClick={handleClearSearch}
                            style={{
                                padding: '12px 24px',
                                background: '#ee4d2d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Xóa tìm kiếm
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}
                    >
                        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🛍️</div>
                        <h3 style={{ fontSize: '20px', color: '#333', marginBottom: '10px' }}>
                            Bắt đầu tìm kiếm
                        </h3>
                        <p style={{ color: '#666' }}>
                            Nhập từ khóa vào ô tìm kiếm để tìm sản phẩm bạn cần
                        </p>
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
}

export default SearchResultsPage;
