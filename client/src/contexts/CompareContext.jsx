import React, { createContext, useState, useContext, useEffect } from 'react';

const CompareContext = createContext();

export const useCompare = () => {
    const context = useContext(CompareContext);
    if (!context) {
        throw new Error('useCompare must be used within CompareProvider');
    }
    return context;
};

export const CompareProvider = ({ children }) => {
    const [compareList, setCompareList] = useState([]);
    const MAX_COMPARE = 4; // Maximum products to compare

    // Load compare list from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('compareList');
        if (saved) {
            try {
                setCompareList(JSON.parse(saved));
            } catch (error) {
                console.error('Error loading compare list:', error);
            }
        }
    }, []);

    // Save compare list to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('compareList', JSON.stringify(compareList));
    }, [compareList]);

    const addToCompare = (product) => {
        setCompareList(prev => {
            const exists = prev.find(item => item.id === product.id);
            if (exists) {
                return prev; // Already in compare list
            }
            if (prev.length >= MAX_COMPARE) {
                // Remove oldest item if at max
                return [...prev.slice(1), product];
            }
            return [...prev, product];
        });
    };

    const removeFromCompare = (productId) => {
        setCompareList(prev => prev.filter(item => item.id !== productId));
    };

    const isInCompare = (productId) => {
        return compareList.some(item => item.id === productId);
    };

    const clearCompare = () => {
        setCompareList([]);
    };

    const value = {
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
        compareCount: compareList.length,
        maxCompare: MAX_COMPARE
    };

    return (
        <CompareContext.Provider value={value}>
            {children}
        </CompareContext.Provider>
    );
};
