import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import '../modern-styles.css';

function BannerContentPage() {
    const { bannerId } = useParams();
    const navigate = useNavigate();
    const [banner, setBanner] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBannerContent();
    }, [bannerId]);

    const fetchBannerContent = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:3000/api/banner-contents/${bannerId}`);
            setBanner(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching banner content:', err);
            setError('Không tìm thấy nội dung banner này');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%'
                    }}
                />
            </div>
        );
    }

    if (error || !banner) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                flexDirection: 'column',
                padding: '20px'
            }}>
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                        background: 'rgba(255,255,255,0.95)',
                        padding: '40px',
                        borderRadius: '20px',
                        textAlign: 'center',
                        maxWidth: '500px'
                    }}
                >
                    <h2 style={{ color: '#e74c3c', marginBottom: '20px' }}>😔 Oops!</h2>
                    <p style={{ color: '#555', marginBottom: '30px' }}>{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '12px 30px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '25px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Về Trang Chủ
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            paddingTop: '80px',
            paddingBottom: '60px'
        }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        background: 'rgba(255,255,255,0.95)',
                        borderRadius: '30px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}
                >
                    {/* Banner Image */}
                    {banner.imageUrl && (
                        <motion.div
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.8 }}
                            style={{
                                width: '100%',
                                height: '400px',
                                overflow: 'hidden'
                            }}
                        >
                            <img
                                src={banner.imageUrl}
                                alt={banner.title}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </motion.div>
                    )}

                    {/* Content */}
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        style={{ padding: '50px' }}
                    >
                        <h1 style={{
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '30px'
                        }}>
                            {banner.title}
                        </h1>

                        <div
                            style={{
                                fontSize: '1.1rem',
                                lineHeight: '1.8',
                                color: '#555',
                                whiteSpace: 'pre-wrap'
                            }}
                            dangerouslySetInnerHTML={{ __html: banner.content }}
                        />

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/')}
                            style={{
                                marginTop: '40px',
                                padding: '15px 40px',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '30px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                boxShadow: '0 10px 30px rgba(102,126,234,0.3)'
                            }}
                        >
                            ← Quay Lại Trang Chủ
                        </motion.button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}

export default BannerContentPage;
