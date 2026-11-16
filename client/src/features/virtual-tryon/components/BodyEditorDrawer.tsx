import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { Profile } from '../../../contexts/FittingRoomContext';
import CustomSlider from './CustomSlider';
import BodyShapeIndicator, { estimateBodyFromHW } from './BodyPresets';
import {
    getBodyMeasurementRanges,
    sanitizeBodyMeasurements,
    updateMeasurementField,
    type BodyMeasurementKey,
} from '../../../utils/bodyProfileConstraints';

interface BodyEditorDrawerProps {
    profile: Profile;
    isOpen: boolean;
    onClose: () => void;
    onSave: (profile: Profile) => void;
    onChange: (profile: Profile) => void;
    showToast: (message: string, type?: string) => void;
}

/* ─── Slider field definition ─── */
interface SliderField {
    label: string;
    field: BodyMeasurementKey;
    min: number;
    max: number;
    unit?: string;
}

/* Main body measurements — always visible */
const PRIMARY_SLIDERS: SliderField[] = [
    { label: 'Vòng ngực', field: 'chest', min: 70, max: 120 },
    { label: 'Vòng eo', field: 'waist', min: 55, max: 100 },
    { label: 'Vòng hông', field: 'hips', min: 80, max: 120 },
];

/* Minor measurements — hidden by default */
const ADVANCED_FIELDS: SliderField[] = [
    { label: 'Vai', field: 'shoulder', min: 30, max: 50 },
    { label: 'Vòng bụng', field: 'belly', min: 60, max: 120 },
    { label: 'Bắp tay', field: 'arm', min: 20, max: 40 },
    { label: 'Bắp đùi', field: 'thigh', min: 40, max: 80 },
    { label: 'Chiều dài chân', field: 'legLength', min: 70, max: 115 },
];

/* ─── Inline number input (clean, large, minimal) ─── */
function NumberInput({ label, value, unit, onChange }: {
    label: string; value: number; unit: string;
    onChange: (v: number) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        onChange(value + (e.deltaY < 0 ? 1 : -1));
    }, [value, onChange]);

    return (
        <div className="bed-input" onWheel={handleWheel}>
            <label className="bed-input__label">{label}</label>
            <div className="bed-input__field">
                <button className="bed-input__step" onClick={() => onChange(value - 1)} aria-label="Giảm">−</button>
                <input
                    ref={inputRef}
                    className="bed-input__value"
                    type="number"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    onFocus={() => inputRef.current?.select()}
                />
                <span className="bed-input__unit">{unit}</span>
                <button className="bed-input__step" onClick={() => onChange(value + 1)} aria-label="Tăng">+</button>
            </div>
        </div>
    );
}

export default function BodyEditorDrawer({ profile, isOpen, onClose, onSave, onChange, showToast }: BodyEditorDrawerProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const advancedRef = useRef<HTMLDivElement>(null);
    const [advancedHeight, setAdvancedHeight] = useState(0);
    const dynamicRanges = useMemo(
        () => getBodyMeasurementRanges(profile.height, profile.weight, profile),
        [profile],
    );

    // Measure advanced section height for smooth animation
    useEffect(() => {
        if (advancedRef.current) {
            setAdvancedHeight(advancedRef.current.scrollHeight);
        }
    }, [profile, showAdvanced]);

    /** Auto-fill all measurements from current height + weight */
    const handleAutoFill = useCallback(() => {
        const estimated = estimateBodyFromHW(profile.height, profile.weight);
        onChange(sanitizeBodyMeasurements({ ...profile, ...estimated }));
        showToast('Đã tự động ước lượng số đo');
    }, [profile, onChange, showToast]);

    const handleFieldChange = useCallback((field: BodyMeasurementKey, value: number) => {
        onChange(updateMeasurementField(profile, field, value));
    }, [profile, onChange]);

    const handleReset = useCallback(() => {
        setShowAdvanced(false);
        const estimated = estimateBodyFromHW(165, 55);
        onChange(sanitizeBodyMeasurements({
            ...profile,
            height: 165, weight: 55,
            ...estimated,
        }));
        showToast('Đã khôi phục về dáng tiêu chuẩn');
    }, [profile, onChange, showToast]);

    const handleSave = useCallback(() => {
        onSave(profile);
        showToast('Đã lưu thông số cơ thể!');
    }, [profile, onSave, showToast]);

    const bmi = (profile.weight / ((profile.height / 100) ** 2)).toFixed(1);
    const bmiCategory = Number(bmi) < 18.5 ? 'Thiếu cân' : Number(bmi) < 25 ? 'Bình thường' : Number(bmi) < 30 ? 'Thừa cân' : 'Béo phì';

    return (
        <>
            <div
                className={`vto-drawer-backdrop ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <div className={`vto-drawer ${isOpen ? 'open' : ''}`}>
                {/* ── Header ── */}
                <div className="bed-header">
                    <div className="bed-header__row">
                        <h3 className="bed-header__title">Số đo cơ thể</h3>
                        <button className="bed-close" onClick={onClose} aria-label="Đóng">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                    <p className="bed-header__meta">BMI {bmi} · {bmiCategory}</p>
                </div>

                {/* ── Body (scrollable) ── */}
                <div className="bed-body">
                    {/* Detected body shape indicator */}
                    <BodyShapeIndicator profile={profile} onAutoFill={handleAutoFill} />

                    {/* Primary inputs — Height & Weight */}
                    <div className="bed-primary">
                        <NumberInput
                            label="Chiều cao"
                            value={profile.height}
                            unit="cm"
                            onChange={(v) => handleFieldChange('height', v)}
                        />
                        <NumberInput
                            label="Cân nặng"
                            value={profile.weight}
                            unit="kg"
                            onChange={(v) => handleFieldChange('weight', v)}
                        />
                    </div>

                    {/* Primary sliders — chest / shoulder / hips */}
                    <div className="bed-sliders">
                        {PRIMARY_SLIDERS.map(f => {
                            const range = dynamicRanges[f.field] || { min: f.min, max: f.max };
                            return (
                                <CustomSlider
                                    key={f.field}
                                    label={f.label}
                                    value={profile[f.field] as number}
                                    min={range.min}
                                    max={range.max}
                                    unit={f.unit || 'cm'}
                                    onChange={(v) => handleFieldChange(f.field, v)}
                                />
                            );
                        })}
                    </div>

                    {/* Advanced disclosure */}
                    <button
                        className={`bed-advanced-toggle ${showAdvanced ? 'open' : ''}`}
                        onClick={() => setShowAdvanced(v => !v)}
                    >
                        <span>Chi tiết thêm</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {/* Advanced slider area */}
                    <div
                        className="bed-advanced"
                        style={{ maxHeight: showAdvanced ? `${advancedHeight}px` : '0px' }}
                    >
                        <div ref={advancedRef} className="bed-advanced__inner">
                            {ADVANCED_FIELDS.map(f => {
                                const range = dynamicRanges[f.field] || { min: f.min, max: f.max };
                                return (
                                    <CustomSlider
                                        key={f.field}
                                        label={f.label}
                                        value={profile[f.field] as number}
                                        min={range.min}
                                        max={range.max}
                                        unit={f.unit || 'cm'}
                                        onChange={(v) => handleFieldChange(f.field, v)}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="bed-footer">
                    <button className="vto-btn vto-btn--ghost" onClick={handleReset}>
                        Đặt lại
                    </button>
                    <button className="vto-btn vto-btn--primary" onClick={handleSave}>
                        Xác nhận
                    </button>
                </div>
            </div>
        </>
    );
}
