import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000';
const WishlistContext = createContext();

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);

    // Load wishlist from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('wishlist');
        if (saved) {
            try {
                setWishlist(JSON.parse(saved));
            } catch (error) {
                console.error('Error loading wishlist:', error);
            }
        }
    }, []);

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }, [wishlist]);

    // Đồng bộ wishlist khi user đăng nhập
    const syncWishlist = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            const res = await axios.post(`${API_URL}/api/wishlist/sync`, {
                localProducts: localWishlist,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.products) {
                // Map server products to local format
                const synced = res.data.products.map(p => ({
                    id: p.productId,
                    name: p.name,
                    price: p.price,
                    img: p.img,
                    category: p.category,
                }));
                setWishlist(synced);
            }
        } catch (err) {
            console.log('Wishlist sync error (ok if not logged in):', err.message);
        }
    };

    // Sync on mount if token exists
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) syncWishlist();
    }, []);

    const addToWishlist = async (product) => {
        setWishlist(prev => {
            const exists = prev.find(item => item.id === product.id);
            if (exists) return prev;
            return [...prev, product];
        });

        // Sync lên server nếu đã đăng nhập
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await axios.post(`${API_URL}/api/wishlist/add`, { product }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (err) {
            console.log('Add to wishlist server error:', err.message);
        }
    };

    const removeFromWishlist = async (productId) => {
        setWishlist(prev => prev.filter(item => item.id !== productId));

        // Sync lên server
        try {
            const token = localStorage.getItem('token');
            if (token) {
                await axios.post(`${API_URL}/api/wishlist/remove`, { productId }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (err) {
            console.log('Remove from wishlist server error:', err.message);
        }
    };

    const isInWishlist = (productId) => {
        return wishlist.some(item => item.id === productId);
    };

    const clearWishlist = () => {
        setWishlist([]);
    };

    const value = {
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        syncWishlist,
        wishlistCount: wishlist.length
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};
