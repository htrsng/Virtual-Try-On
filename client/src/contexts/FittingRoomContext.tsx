/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { sanitizeBodyMeasurements } from '../utils/bodyProfileConstraints';

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

interface FittingRoomContextType {
    avatars: Profile[];
    currentAvatarId: string | null;
    currentAvatar: Profile;
    selectedSize: string | null;
    isHeatmapOpen: boolean;
    setCurrentAvatarId: (id: string) => void;
    setSelectedSize: (size: string | null) => void;
    toggleHeatmap: () => void;
    updateAvatar: (id: string, updates: Partial<Profile>) => void;
    addAvatar: (profile: Profile) => void;
    removeAvatar: (id: string) => void;

    // Backward-compatible aliases for existing Try-On code.
    profiles: Profile[];
    activeProfileId: string;
    activeProfile: Profile | null;
    setActiveProfileId: (id: string) => void;
    updateProfile: (id: string, updates: Partial<Profile>) => void;
    addProfile: (profile: Profile) => void;
}

const FittingRoomContext = createContext<FittingRoomContextType | undefined>(undefined);

const AVATARS_STORAGE_KEY = 'vfit_avatars';
const ACTIVE_AVATAR_STORAGE_KEY = 'vfit_current_avatar_id';

const DEFAULT_MEASUREMENTS: Omit<Profile, 'id' | 'name'> = {
    height: 165,
    weight: 55,
    chest: 85,
    waist: 68,
    hips: 92,
    shoulder: 38,
    arm: 26,
    thigh: 50,
    belly: 70,
    legLength: 95,
};

const GUEST_AVATAR: Profile = sanitizeBodyMeasurements({
    id: 'guest-avatar',
    name: 'Khách',
    ...DEFAULT_MEASUREMENTS,
});

const toNumber = (value: unknown, fallback: number) => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeProfile = (input: unknown, index: number): Profile | null => {
    if (!input || typeof input !== 'object') {
        return null;
    }

    const candidate = input as Partial<Profile>;
    const id = typeof candidate.id === 'string' && candidate.id.trim().length > 0
        ? candidate.id.trim()
        : `avatar-${index + 1}`;
    const name = typeof candidate.name === 'string' && candidate.name.trim().length > 0
        ? candidate.name.trim()
        : `Avatar ${index + 1}`;

    return sanitizeBodyMeasurements({
        id,
        name,
        height: toNumber(candidate.height, DEFAULT_MEASUREMENTS.height),
        weight: toNumber(candidate.weight, DEFAULT_MEASUREMENTS.weight),
        chest: toNumber(candidate.chest, DEFAULT_MEASUREMENTS.chest),
        waist: toNumber(candidate.waist, DEFAULT_MEASUREMENTS.waist),
        hips: toNumber(candidate.hips, DEFAULT_MEASUREMENTS.hips),
        shoulder: toNumber(candidate.shoulder, DEFAULT_MEASUREMENTS.shoulder),
        arm: toNumber(candidate.arm, DEFAULT_MEASUREMENTS.arm),
        thigh: toNumber(candidate.thigh, DEFAULT_MEASUREMENTS.thigh),
        belly: toNumber(candidate.belly, DEFAULT_MEASUREMENTS.belly),
        legLength: toNumber(candidate.legLength, DEFAULT_MEASUREMENTS.legLength),
    });
};

const loadStoredAvatars = (): Profile[] => {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = localStorage.getItem(AVATARS_STORAGE_KEY);
        if (!raw) {
            return [];
        }

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) {
            return [];
        }

        const normalized = parsed
            .map((item, index) => normalizeProfile(item, index))
            .filter((item): item is Profile => item !== null);

        const deduped = normalized.filter((profile, index, all) =>
            all.findIndex((item) => item.id === profile.id) === index,
        );

        return deduped;
    } catch {
        return [];
    }
};

const loadStoredActiveAvatarId = (): string | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    const raw = localStorage.getItem(ACTIVE_AVATAR_STORAGE_KEY);
    if (!raw) {
        return null;
    }

    const id = raw.trim();
    return id.length > 0 ? id : null;
};

const generateAvatarId = () => `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const FittingRoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [avatars, setAvatars] = useState<Profile[]>(loadStoredAvatars);
    const [currentAvatarId, setCurrentAvatarIdState] = useState<string | null>(loadStoredActiveAvatarId);
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);

    useEffect(() => {
        if (avatars.length === 0) {
            if (currentAvatarId !== null) {
                setCurrentAvatarIdState(null);
            }
            return;
        }

        if (!currentAvatarId || !avatars.some((avatar) => avatar.id === currentAvatarId)) {
            setCurrentAvatarIdState(avatars[0].id);
        }
    }, [avatars, currentAvatarId]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (avatars.length === 0) {
            localStorage.removeItem(AVATARS_STORAGE_KEY);
            return;
        }

        localStorage.setItem(AVATARS_STORAGE_KEY, JSON.stringify(avatars));
    }, [avatars]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        if (!currentAvatarId) {
            localStorage.removeItem(ACTIVE_AVATAR_STORAGE_KEY);
            return;
        }

        localStorage.setItem(ACTIVE_AVATAR_STORAGE_KEY, currentAvatarId);
    }, [currentAvatarId]);

    const activeAvatar = useMemo(
        () => avatars.find((avatar) => avatar.id === currentAvatarId) || null,
        [avatars, currentAvatarId],
    );

    const currentAvatar = activeAvatar || GUEST_AVATAR;

    const setCurrentAvatarId = (id: string) => {
        const normalizedId = id.trim();
        setCurrentAvatarIdState(normalizedId.length > 0 ? normalizedId : null);
    };

    const addAvatar = (profile: Profile) => {
        const sanitized = normalizeProfile(profile, avatars.length) || {
            ...GUEST_AVATAR,
            id: generateAvatarId(),
            name: `Avatar ${avatars.length + 1}`,
        };

        setAvatars((prev) => {
            const exists = prev.some((item) => item.id === sanitized.id);
            if (exists) {
                return prev.map((item) => (item.id === sanitized.id ? sanitized : item));
            }
            return [...prev, sanitized];
        });
        setCurrentAvatarIdState((prev) => prev || sanitized.id);
    };

    const updateAvatar = (id: string, updates: Partial<Profile>) => {
        setAvatars((prev) => prev.map((avatar) => {
            if (avatar.id !== id) {
                return avatar;
            }

            const nextName = typeof updates.name === 'string' && updates.name.trim().length > 0
                ? updates.name.trim()
                : avatar.name;

            return sanitizeBodyMeasurements({
                ...avatar,
                ...updates,
                id: avatar.id,
                name: nextName,
            });
        }));
    };

    const removeAvatar = (id: string) => {
        setAvatars((prev) => prev.filter((avatar) => avatar.id !== id));

        if (currentAvatarId === id) {
            setCurrentAvatarIdState(null);
        }
    };

    const value: FittingRoomContextType = {
        avatars,
        currentAvatarId,
        currentAvatar,
        selectedSize,
        isHeatmapOpen,
        setCurrentAvatarId,
        setSelectedSize,
        toggleHeatmap: () => setIsHeatmapOpen((prev) => !prev),
        updateAvatar,
        addAvatar,
        removeAvatar,

        profiles: avatars,
        activeProfileId: currentAvatarId || '',
        activeProfile: activeAvatar,
        setActiveProfileId: setCurrentAvatarId,
        updateProfile: updateAvatar,
        addProfile: addAvatar,
    };

    return (
        <FittingRoomContext.Provider value={value}>
            {children}
        </FittingRoomContext.Provider>
    );
};

export const useFittingRoom = () => {
    const context = useContext(FittingRoomContext);
    if (!context) {
        throw new Error('useFittingRoom must be used within a FittingRoomProvider');
    }
    return context;
};