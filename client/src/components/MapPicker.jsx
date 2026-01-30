import React, { useEffect, useRef } from 'react';

// Google Maps Embed API (iframe) component
const MapPicker = ({ address, onSelect }) => {
    const iframeRef = useRef(null);
    // Chỉ hiển thị bản đồ khi có địa chỉ
    const mapUrl = address
        ? `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`
        : 'https://www.google.com/maps?q=Hanoi&output=embed';

    useEffect(() => {
        // Không có tương tác chọn vị trí thực sự, chỉ hiển thị bản đồ preview
        // Nếu muốn chọn vị trí, cần dùng Google Maps JS API hoặc leaflet
    }, [address]);

    return (
        <div style={{ width: '100%', height: 300, borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
            <iframe
                ref={iframeRef}
                title="Chọn vị trí giao hàng"
                width="100%"
                height="100%"
                frameBorder="0"
                src={mapUrl}
                style={{ border: 0 }}
                allowFullScreen
            />
        </div>
    );
};

export default MapPicker;
