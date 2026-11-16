import React from 'react';

// Component hiển thị bản đồ đơn giản qua iframe
const MapPicker = ({ address }) => {
    if (!address) {
        return (
            <div style={{
                width: '100%',
                height: 400,
                borderRadius: 8,
                border: '1px solid #ddd',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5'
            }}>
                <p style={{ color: '#999' }}>Chưa có địa chỉ để hiển thị</p>
            </div>
        );
    }

    const encodedAddress = encodeURIComponent(address);
    const mapUrl = `https://maps.google.com/maps?q=${encodedAddress}&output=embed`;

    return (
        <div style={{ width: '100%' }}>
            <iframe
                src={mapUrl}
                width="100%"
                height="400"
                style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Google Maps"
            />
        </div>
    );
};

export default MapPicker;
