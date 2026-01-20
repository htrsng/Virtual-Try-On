import React, { useState, useEffect } from 'react';

function Banner({ data }) {
    const [index, setIndex] = useState(0);

    const images = data ? data.big : [];

    useEffect(() => {
        if (images.length > 0) {
            const timer = setInterval(() => {
                setIndex((prev) => (prev + 1) % images.length);
            }, 4000);
            return () => clearInterval(timer);
        }
    }, [images]);

    const nextSlide = () => {
        setIndex((prev) => (prev + 1) % images.length);
    };

    const prevSlide = () => {
        setIndex((prev) => (prev - 1 + images.length) % images.length);
    };

    if (!data) return null;

    return (
        <div className="container banner-section" style={{ position: 'relative' }}>
            <div className="banner-left" style={{ position: 'relative' }}>
                <img
                    src={images[index]}
                    alt="Banner chính"
                    className="banner-img-big"
                    // 👇 SỬA Ở ĐÂY: Đổi link sang placehold.co
                    onError={(e) => {
                        e.target.onerror = null; // Chặn lặp vô hạn
                        e.target.src = "https://placehold.co/800x235?text=Anh+Loi"
                    }}
                />

                {/* Nút điều hướng Trái */}
                <button
                    onClick={prevSlide}
                    style={{
                        position: 'absolute', top: '50%', left: '10px', transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none',
                        width: '30px', height: '40px', cursor: 'pointer', fontSize: '20px', zIndex: 10
                    }}
                >
                    &#10094;
                </button>

                {/* Nút điều hướng Phải */}
                <button
                    onClick={nextSlide}
                    style={{
                        position: 'absolute', top: '50%', right: '10px', transform: 'translateY(-50%)',
                        background: 'rgba(0,0,0,0.3)', color: 'white', border: 'none',
                        width: '30px', height: '40px', cursor: 'pointer', fontSize: '20px', zIndex: 10
                    }}
                >
                    &#10095;
                </button>

                <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '5px', zIndex: 10 }}>
                    {images.map((_, i) => (
                        <div key={i} style={{
                            width: i === index ? '10px' : '6px',
                            height: i === index ? '10px' : '6px',
                            borderRadius: '50%',
                            background: i === index ? '#ee4d2d' : 'rgba(255,255,255,0.5)',
                            border: '1px solid #fff'
                        }}></div>
                    ))}
                </div>
            </div>

            <div className="banner-right">
                <img
                    src={data.smallTop}
                    alt="Banner phụ 1"
                    className="banner-img-small"
                    // 👇 SỬA Ở ĐÂY
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/390x115?text=Anh+Loi"
                    }}
                />
                <img
                    src={data.smallBottom}
                    alt="Banner phụ 2"
                    className="banner-img-small"
                    // 👇 SỬA Ở ĐÂY
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://placehold.co/390x115?text=Anh+Loi"
                    }}
                />
            </div>
        </div>
    );
}

export default Banner;