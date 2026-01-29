import React from 'react';

interface LabelInputProps {
    label: string;
    val: number;
    min: number;
    max: number;
    onChange: (v: number) => void;
    unit?: string; // Thêm props unit
}

export const LabelInput: React.FC<LabelInputProps> = ({ label, val, min, max, onChange, unit = '' }) => (
    <div>
        <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <span className="text-sm font-bold bg-white border px-2 py-0.5 rounded text-gray-900 shadow-sm">
                {val} <span className="text-xs text-gray-400 font-normal">{unit}</span>
            </span>
        </div>
        <input
            type="range"
            min={min}
            max={max}
            value={val}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" // accent-black để thanh trượt màu đen sang trọng
        />
    </div>
);