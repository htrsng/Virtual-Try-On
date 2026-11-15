import { useRef, useCallback, useState } from 'react';

interface CustomSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    unit?: string;
    icon?: string;
    onChange: (value: number) => void;
}

export default function CustomSlider({ label, value, min, max, unit = 'cm', onChange }: CustomSliderProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const percent = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

    const handlePointerEvent = useCallback((clientX: number) => {
        if (!trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        const newValue = Math.round(min + ratio * (max - min));
        onChange(newValue);
    }, [min, max, onChange]);

    const onPointerDown = useCallback((e: React.PointerEvent) => {
        setIsDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        handlePointerEvent(e.clientX);
    }, [handlePointerEvent]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging) return;
        handlePointerEvent(e.clientX);
    }, [isDragging, handlePointerEvent]);

    const onPointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    return (
        <div className={`vto-slider ${isDragging ? 'is-dragging' : ''}`}>
            <div className="vto-slider__header">
                <span className="vto-slider__label">{label}</span>
                <span className="vto-slider__value">{value}<small>{unit}</small></span>
            </div>
            <div
                className="vto-slider__track"
                ref={trackRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
            >
                <div className="vto-slider__fill" style={{ width: `${percent}%` }} />
                <div className="vto-slider__thumb" style={{ left: `${percent}%` }} />
            </div>
        </div>
    );
}
