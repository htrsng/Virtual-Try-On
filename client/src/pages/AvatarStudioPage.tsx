import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Environment, Grid, Html, OrbitControls, useProgress } from '@react-three/drei';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../three/controls/avatar/Avatar';
import { useFittingRoom, type Profile } from '../contexts/FittingRoomContext';
import {
    estimateBodyFromHW,
    getBodyMeasurementRanges,
    sanitizeBodyMeasurements,
    updateMeasurementField,
    type BodyMeasurementKey,
} from '../utils/bodyProfileConstraints';
import BodyShapeIndicator from '../features/virtual-tryon/components/BodyPresets';
import CustomSlider from '../features/virtual-tryon/components/CustomSlider';
import '../features/virtual-tryon/VirtualTryOn.css';
import './AvatarStudioPage.css';

const ADVANCED_SCROLL_MAX_HEIGHT = 264;

const DEFAULT_AVATAR_BODY: Omit<Profile, 'id' | 'name'> = {
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

type AvatarStudioLocationState = {
    returnTo?: string;
    returnState?: unknown;
};

type SliderField = {
    key: BodyMeasurementKey;
    label: string;
    unit: string;
};

const BASIC_FIELDS: SliderField[] = [
    { key: 'height', label: 'Chiều cao', unit: 'cm' },
    { key: 'weight', label: 'Cân nặng', unit: 'kg' },
    { key: 'chest', label: 'Vòng ngực', unit: 'cm' },
    { key: 'waist', label: 'Vòng eo', unit: 'cm' },
    { key: 'hips', label: 'Vòng hông', unit: 'cm' },
];

const ADVANCED_FIELDS: SliderField[] = [
    { key: 'shoulder', label: 'Vai', unit: 'cm' },
    { key: 'belly', label: 'Vòng bụng', unit: 'cm' },
    { key: 'arm', label: 'Bắp tay', unit: 'cm' },
    { key: 'thigh', label: 'Bắp đùi', unit: 'cm' },
    { key: 'legLength', label: 'Chiều dài chân', unit: 'cm' },
];

const generateAvatarId = () => `avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createDraftAvatar = (name: string): Profile => {
    return sanitizeBodyMeasurements({
        id: generateAvatarId(),
        name,
        ...DEFAULT_AVATAR_BODY,
    });
};

const cloneAvatar = (avatar: Profile): Profile => ({ ...avatar });

function StudioLoader() {
    const { progress } = useProgress();

    return (
        <Html center>
            <div className="avatar-studio__loader">
                <span className="avatar-studio__loader-ring" />
                <span>Đang tải avatar... {progress.toFixed(0)}%</span>
            </div>
        </Html>
    );
}

function NumberInput({
    label,
    value,
    unit,
    onChange,
}: {
    label: string;
    value: number;
    unit: string;
    onChange: (value: number) => void;
}) {
    return (
        <div className="bed-input">
            <label className="bed-input__label">{label}</label>
            <div className="bed-input__field">
                <button className="bed-input__step" onClick={() => onChange(value - 1)} aria-label={`Giảm ${label}`}>
                    -
                </button>
                <input
                    className="bed-input__value"
                    type="number"
                    value={value}
                    onChange={(event) => onChange(Number(event.target.value))}
                />
                <span className="bed-input__unit">{unit}</span>
                <button className="bed-input__step" onClick={() => onChange(value + 1)} aria-label={`Tăng ${label}`}>
                    +
                </button>
            </div>
        </div>
    );
}

export default function AvatarStudioPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const routeState = (location.state || {}) as AvatarStudioLocationState;

    const {
        avatars,
        currentAvatarId,
        setCurrentAvatarId,
        addAvatar,
        updateAvatar,
        removeAvatar,
    } = useFittingRoom();

    const [editingAvatarId, setEditingAvatarId] = useState<string | null>(currentAvatarId);
    const [isCreatingNew, setIsCreatingNew] = useState(avatars.length === 0);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [draftAvatar, setDraftAvatar] = useState<Profile>(() => {
        const selected = currentAvatarId ? avatars.find((avatar) => avatar.id === currentAvatarId) : null;
        if (selected) {
            return cloneAvatar(selected);
        }
        return createDraftAvatar('Avatar mới');
    });
    const [notice, setNotice] = useState<string | null>(null);
    const noticeTimerRef = useRef<number | null>(null);
    const advancedRef = useRef<HTMLDivElement>(null);
    const [advancedHeight, setAdvancedHeight] = useState(0);

    const isCreateMode = isCreatingNew || !editingAvatarId;
    const displayDraftName = draftAvatar.name.trim() || 'Avatar mới';
    const advancedPanelHeight = Math.min(advancedHeight, ADVANCED_SCROLL_MAX_HEIGHT);
    const isDefaultAvatar = !isCreateMode && draftAvatar.id === currentAvatarId;

    const selectedAvatar = useMemo(
        () => (editingAvatarId ? avatars.find((avatar) => avatar.id === editingAvatarId) || null : null),
        [avatars, editingAvatarId],
    );

    const ranges = useMemo(
        () => getBodyMeasurementRanges(draftAvatar.height, draftAvatar.weight, draftAvatar),
        [draftAvatar],
    );

    const bmi = (draftAvatar.weight / ((draftAvatar.height / 100) ** 2)).toFixed(1);

    const showNotice = useCallback((message: string) => {
        setNotice(message);
        if (noticeTimerRef.current) {
            window.clearTimeout(noticeTimerRef.current);
        }
        noticeTimerRef.current = window.setTimeout(() => {
            setNotice(null);
        }, 2200);
    }, []);

    useEffect(() => {
        return () => {
            if (noticeTimerRef.current) {
                window.clearTimeout(noticeTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (advancedRef.current) {
            setAdvancedHeight(advancedRef.current.scrollHeight);
        }
    }, [draftAvatar, isAdvancedOpen]);

    useEffect(() => {
        if (avatars.length === 0) {
            setIsCreatingNew(true);
            setEditingAvatarId(null);
            return;
        }

        if (isCreatingNew) {
            return;
        }

        if (editingAvatarId && avatars.some((avatar) => avatar.id === editingAvatarId)) {
            return;
        }

        const fallbackId = currentAvatarId && avatars.some((avatar) => avatar.id === currentAvatarId)
            ? currentAvatarId
            : avatars[0].id;
        const fallbackAvatar = avatars.find((avatar) => avatar.id === fallbackId) || avatars[0];

        setEditingAvatarId(fallbackAvatar.id);
        setDraftAvatar(cloneAvatar(fallbackAvatar));
    }, [avatars, editingAvatarId, currentAvatarId, isCreatingNew]);

    const handleCreateNewDraft = useCallback(() => {
        const usedNames = new Set(avatars.map((avatar) => avatar.name.trim().toLowerCase()));
        let nextNumber = avatars.length + 1;
        let suggestedName = `Avatar ${nextNumber}`;
        while (usedNames.has(suggestedName.toLowerCase())) {
            nextNumber += 1;
            suggestedName = `Avatar ${nextNumber}`;
        }

        setIsCreatingNew(true);
        setEditingAvatarId(null);
        setDraftAvatar(createDraftAvatar(suggestedName));
    }, [avatars]);

    const handleSelectAvatar = useCallback((avatarId: string) => {
        const selected = avatars.find((avatar) => avatar.id === avatarId);
        if (!selected) {
            return;
        }

        setEditingAvatarId(selected.id);
        setIsCreatingNew(false);
        setDraftAvatar(cloneAvatar(selected));
    }, [avatars]);

    const handleMeasurementChange = useCallback((field: BodyMeasurementKey, value: number) => {
        setDraftAvatar((prev) => updateMeasurementField(prev, field, value));
    }, []);

    const handleAutoFill = useCallback(() => {
        setDraftAvatar((prev) => sanitizeBodyMeasurements({
            ...prev,
            ...estimateBodyFromHW(prev.height, prev.weight),
        }));
        showNotice('Đã tự động ước lượng số đo.');
    }, [showNotice]);

    const handleReset = useCallback(() => {
        setDraftAvatar((prev) => sanitizeBodyMeasurements({
            ...prev,
            ...DEFAULT_AVATAR_BODY,
        }));
        showNotice('Đã đưa số đo về mặc định.');
    }, [showNotice]);

    const navigateToTryOn = useCallback(() => {
        const targetPath = routeState.returnTo || '/try-on';
        navigate(targetPath, { state: routeState.returnState });
    }, [navigate, routeState.returnState, routeState.returnTo]);

    const handleSaveAvatar = useCallback(() => {
        const cleanedName = draftAvatar.name.trim() || `Avatar ${avatars.length + 1}`;
        const payload = sanitizeBodyMeasurements({
            ...draftAvatar,
            name: cleanedName,
        });

        if (isCreateMode) {
            addAvatar(payload);
            setIsCreatingNew(false);
            setEditingAvatarId(payload.id);
            setDraftAvatar(payload);
            showNotice('Đã tạo avatar mới.');
            navigateToTryOn();
            return;
        }

        updateAvatar(payload.id, payload);
        setIsCreatingNew(false);
        setDraftAvatar(payload);
        showNotice('Đã cập nhật avatar.');
        navigateToTryOn();
    }, [addAvatar, avatars.length, draftAvatar, isCreateMode, navigateToTryOn, showNotice, updateAvatar]);

    const handleSetDefaultAvatar = useCallback(() => {
        if (isCreateMode) {
            showNotice('Hãy lưu avatar trước khi đặt làm mặc định.');
            return;
        }

        if (draftAvatar.id === currentAvatarId) {
            showNotice('Avatar này đang là mặc định.');
            return;
        }

        setCurrentAvatarId(draftAvatar.id);
        showNotice(`Đã đặt \"${displayDraftName}\" làm avatar mặc định.`);
    }, [currentAvatarId, displayDraftName, draftAvatar.id, isCreateMode, setCurrentAvatarId, showNotice]);

    const handleDeleteAvatar = useCallback(() => {
        if (!selectedAvatar) {
            return;
        }

        const approved = window.confirm(`Xóa avatar \"${selectedAvatar.name}\"?`);
        if (!approved) {
            return;
        }

        removeAvatar(selectedAvatar.id);
        setIsCreatingNew(true);
        setEditingAvatarId(null);
        setDraftAvatar(createDraftAvatar('Avatar mới'));
        showNotice('Đã xóa avatar.');
    }, [removeAvatar, selectedAvatar, showNotice]);

    return (
        <div className="avatar-studio">
            <header className="avatar-studio__header">
                <button type="button" className="avatar-studio__back" onClick={navigateToTryOn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span>Quay lại Try-On</span>
                </button>
                <div className="avatar-studio__title-wrap">
                    <h1 className="avatar-studio__title">Phòng tạo avatar</h1>
                    <p className="avatar-studio__subtitle">Chọn avatar bên trái và chỉnh số đo bên phải theo thời gian thực.</p>
                </div>
            </header>

            <div className="avatar-studio__workspace">
                <aside className="avatar-studio__list-panel">
                    <h2 className="avatar-studio__list-title">Avatar</h2>
                    <div className="avatar-studio__list">
                        {avatars.map((avatar) => (
                            <button
                                type="button"
                                key={avatar.id}
                                className={`avatar-studio__avatar-card ${editingAvatarId === avatar.id ? 'active' : ''}`}
                                onClick={() => handleSelectAvatar(avatar.id)}
                            >
                                <span className="avatar-studio__avatar-thumb">{avatar.name.charAt(0).toUpperCase()}</span>
                                <strong className="avatar-studio__avatar-card-name">{avatar.name}</strong>
                                {avatar.id === currentAvatarId && (
                                    <span className="avatar-studio__avatar-card-default">Mặc định</span>
                                )}
                            </button>
                        ))}

                        <button
                            type="button"
                            className={`avatar-studio__avatar-card avatar-studio__avatar-card--create ${isCreateMode ? 'active' : ''}`}
                            onClick={handleCreateNewDraft}
                        >
                            <span className="avatar-studio__avatar-thumb avatar-studio__avatar-thumb--create">+</span>
                            <strong className="avatar-studio__avatar-card-name">Tạo avatar</strong>
                        </button>
                    </div>
                </aside>

                <section className="avatar-studio__preview-panel">
                    <div className="avatar-studio__preview-head">
                        <span className="avatar-studio__preview-badge">{displayDraftName}</span>
                    </div>
                    <Canvas className="avatar-studio__canvas" camera={{ position: [0, 0.7, 4.2], fov: 32 }} dpr={[1, 1.5]} shadows>
                        <ambientLight intensity={0.45} />
                        <directionalLight
                            position={[3, 6, 4]}
                            intensity={1.35}
                            castShadow
                            shadow-mapSize-width={1024}
                            shadow-mapSize-height={1024}
                            shadow-camera-near={0.5}
                            shadow-camera-far={20}
                        />
                        <directionalLight position={[-2, 3, -2]} intensity={0.35} />

                        <Environment preset="city" />

                        <Suspense fallback={<StudioLoader />}>
                            <group position={[0, -1.15, 0]}>
                                <Grid position={[0, 0, 0]} args={[10, 10]} cellColor="#d1d5db" sectionColor="#9ca3af" fadeDistance={20} />
                                <Avatar body={draftAvatar} pose="Idle" skinColor="#F2C9AC" />
                                <ContactShadows position={[0, 0.01, 0]} opacity={0.3} blur={1.5} resolution={512} frames={1} />
                            </group>
                        </Suspense>

                        <OrbitControls
                            target={[0, 0.4, 0]}
                            enablePan={false}
                            enableDamping
                            dampingFactor={0.08}
                            minDistance={2.5}
                            maxDistance={5.5}
                        />
                    </Canvas>
                </section>

                <aside className="avatar-studio__editor-panel">
                    <div className="avatar-studio__editor-head">
                        <h2 className="avatar-studio__editor-title">Số đo cơ thể</h2>
                        <span className="avatar-studio__editor-bmi">BMI {bmi}</span>
                    </div>

                    <div className="avatar-studio__editor-body">
                        <div className="avatar-studio__name-group">
                            <label className="avatar-studio__name-label" htmlFor="avatar-name-input">Tên avatar</label>
                            <input
                                id="avatar-name-input"
                                className="avatar-studio__name-input"
                                value={draftAvatar.name}
                                onChange={(event) => {
                                    const nextName = event.target.value;
                                    setDraftAvatar((prev) => ({ ...prev, name: nextName }));
                                }}
                                placeholder="Nhập tên avatar"
                            />
                        </div>

                        <BodyShapeIndicator profile={draftAvatar} onAutoFill={handleAutoFill} />

                        <div className="bed-primary">
                            <NumberInput
                                label="Chiều cao"
                                value={draftAvatar.height}
                                unit="cm"
                                onChange={(value) => handleMeasurementChange('height', value)}
                            />
                            <NumberInput
                                label="Cân nặng"
                                value={draftAvatar.weight}
                                unit="kg"
                                onChange={(value) => handleMeasurementChange('weight', value)}
                            />
                        </div>

                        <div className="bed-sliders">
                            {BASIC_FIELDS.filter((field) => field.key !== 'height' && field.key !== 'weight').map(({ key, label, unit }) => {
                                const range = ranges[key];
                                return (
                                    <CustomSlider
                                        key={key}
                                        label={label}
                                        value={draftAvatar[key]}
                                        min={range.min}
                                        max={range.max}
                                        unit={unit}
                                        onChange={(value) => handleMeasurementChange(key, value)}
                                    />
                                );
                            })}
                        </div>

                        <button
                            className={`bed-advanced-toggle ${isAdvancedOpen ? 'open' : ''}`}
                            onClick={() => setIsAdvancedOpen((prev) => !prev)}
                            type="button"
                        >
                            <span>Chi tiết thêm</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>

                        <div
                            className={`bed-advanced ${isAdvancedOpen ? 'open' : ''}`}
                            style={{ maxHeight: isAdvancedOpen ? `${advancedPanelHeight}px` : '0px' }}
                        >
                            <div ref={advancedRef} className="bed-advanced__inner">
                                {ADVANCED_FIELDS.map(({ key, label, unit }) => {
                                    const range = ranges[key];
                                    return (
                                        <CustomSlider
                                            key={key}
                                            label={label}
                                            value={draftAvatar[key]}
                                            min={range.min}
                                            max={range.max}
                                            unit={unit}
                                            onChange={(value) => handleMeasurementChange(key, value)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="avatar-studio__editor-footer">
                        <button
                            className={`vto-btn vto-btn--ghost avatar-studio__default-btn ${isDefaultAvatar ? 'active' : ''}`}
                            onClick={handleSetDefaultAvatar}
                            type="button"
                        >
                            {isDefaultAvatar ? 'Đang mặc định' : 'Đặt mặc định'}
                        </button>
                        <button className="vto-btn vto-btn--ghost" onClick={handleReset} type="button">
                            Đặt lại
                        </button>
                        <button className="vto-btn vto-btn--primary" onClick={handleSaveAvatar} type="button">
                            Xác nhận
                        </button>
                    </div>

                    {!isCreateMode && (
                        <button
                            className="avatar-studio__delete-btn"
                            onClick={handleDeleteAvatar}
                            type="button"
                        >
                            Xóa avatar này
                        </button>
                    )}

                    {notice && <p className="avatar-studio__notice">{notice}</p>}
                </aside>
            </div>
        </div>
    );
}
