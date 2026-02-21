/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useMemo } from 'react';

// 1. Định nghĩa cấu trúc dữ liệu Profile
export interface Profile {
    id: string;
    name: string;
    height: number;
    weight: number;
    chest: number;
    waist: number;
    hips: number;
    shoulder: number;
    arm: number;
    thigh: number;
    belly: number;
    legLength: number;
}

// 2. Định nghĩa các hàm và dữ liệu mà Context cung cấp
interface FittingRoomContextType {
    profiles: Profile[];
    activeProfileId: string;
    activeProfile: Profile | null;
    selectedSize: string | null;
    isHeatmapOpen: boolean;
    setActiveProfileId: (id: string) => void;
    setSelectedSize: (size: string | null) => void;
    toggleHeatmap: () => void;
    updateProfile: (id: string, updates: Partial<Profile>) => void;
    addProfile: (profile: Profile) => void;
}

const FittingRoomContext = createContext<FittingRoomContextType | undefined>(undefined);

// 3. Giá trị mặc định ban đầu cho cơ thể mẫu
const INITIAL_PROFILES: Profile[] = [
    {
        id: 'p1',
        name: 'Tôi',
        height: 165,
        weight: 55,
        chest: 85,
        waist: 68,
        hips: 92,
        shoulder: 38,
        arm: 26,
        thigh: 50,
        belly: 70,
        legLength: 95
    }
];

export const FittingRoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Chỉ sử dụng state trong bộ nhớ (In-memory storage)
    // Dữ liệu sẽ tự động mất đi và reset về INITIAL_PROFILES khi người dùng nhấn F5 hoặc reload trang
    const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
    const [activeProfileId, setActiveProfileId] = useState<string>('p1');
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);

    // Tìm hồ sơ đang hoạt động một cách tối ưu
    const activeProfile = useMemo(() =>
        profiles.find(p => p.id === activeProfileId) || null,
        [profiles, activeProfileId]);

    // Hàm cập nhật hồ sơ (Chỉ lưu trong phiên làm việc hiện tại)
    const updateProfile = (id: string, updates: Partial<Profile>) => {
        setProfiles(prev => prev.map(p =>
            p.id === id ? { ...p, ...updates } : p
        ));
    };

    // Hàm thêm hồ sơ mới
    const addProfile = (profile: Profile) => {
        setProfiles(prev => [...prev, profile]);
    };

    const value = {
        profiles,
        activeProfileId,
        activeProfile,
        selectedSize,
        isHeatmapOpen,
        setActiveProfileId,
        setSelectedSize,
        toggleHeatmap: () => setIsHeatmapOpen(!isHeatmapOpen),
        updateProfile,
        addProfile
    };

    return (
        <FittingRoomContext.Provider value={value}>
            {children}
        </FittingRoomContext.Provider>
    );
};

// Hook để sử dụng nhanh Context
export const useFittingRoom = () => {
    const context = useContext(FittingRoomContext);
    if (!context) {
        throw new Error('useFittingRoom must be used within a FittingRoomProvider');
    }
    return context;
};