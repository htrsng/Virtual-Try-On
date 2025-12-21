import React from 'react';

interface BodyData {
    height: number;
    weight: number;
}

interface Props {
    data: BodyData;
    onChange: (newData: BodyData) => void;
}

const BodyForm: React.FC<Props> = ({ data, onChange }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onChange({
            ...data,
            [name]: parseFloat(value),
        });
    };

    return (
        <div style={{ padding: '20px', background: '#f4f4f4', borderRadius: '8px', color: '#333' }}>
            <h3>Thông số cơ thể</h3>

            <div style={{ marginBottom: '15px' }}>
                <label>Chiều cao: {data.height} cm</label> <br />
                <input
                    type="range"
                    name="height"
                    min="150"
                    max="200"
                    value={data.height}
                    onChange={handleChange}
                    style={{ width: '100%' }}
                />
            </div>

            <div>
                <label>Cân nặng: {data.weight} kg</label> <br />
                <input
                    type="range"
                    name="weight"
                    min="40"
                    max="120"
                    value={data.weight}
                    onChange={handleChange}
                    style={{ width: '100%' }}
                />
            </div>
        </div>
    );
};

export default BodyForm;