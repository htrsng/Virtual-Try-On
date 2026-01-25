import React from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiTrendingUp, FiUsers, FiHeart } from 'react-icons/fi';

function AboutPage() {
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    const stats = [
        { icon: <FiUsers size={32} />, number: '5M+', label: 'Khách hàng' },
        { icon: <FiTrendingUp size={32} />, number: '10M+', label: 'Sản phẩm bán' },
        { icon: <FiAward size={32} />, number: '4.8★', label: 'Đánh giá' },
        { icon: <FiHeart size={32} />, number: '99%', label: 'Hài lòng' }
    ];

    return (
        <motion.div
            className="container"
            style={{ marginTop: '30px', marginBottom: '50px' }}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <h1 style={{
                fontSize: '36px',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: '20px',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Về Shopee Fashion
            </h1>

            <p style={{
                fontSize: '18px',
                textAlign: 'center',
                maxWidth: '800px',
                margin: '0 auto 50px',
                color: 'var(--text-secondary)',
                lineHeight: '1.8'
            }}>
                Nền tảng thời trang trực tuyến hàng đầu Việt Nam, mang đến trải nghiệm mua sắm hiện đại với công nghệ thử đồ 3D độc đáo
            </p>

            {/* Stats */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '30px',
                marginBottom: '60px'
            }}>
                {stats.map((stat, idx) => (
                    <motion.div
                        key={idx}
                        style={{
                            background: 'var(--bg-card)',
                            padding: '35px',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-md)',
                            textAlign: 'center',
                            border: '2px solid transparent',
                            transition: 'all var(--transition-base)'
                        }}
                        whileHover={{
                            scale: 1.05,
                            boxShadow: 'var(--shadow-colored)',
                            borderColor: 'var(--accent-primary)'
                        }}
                    >
                        <div style={{
                            display: 'inline-flex',
                            padding: '20px',
                            background: 'var(--accent-gradient)',
                            borderRadius: '50%',
                            color: 'white',
                            marginBottom: '20px'
                        }}>
                            {stat.icon}
                        </div>
                        <h2 style={{
                            fontSize: '32px',
                            fontWeight: '700',
                            marginBottom: '8px',
                            background: 'var(--accent-gradient)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {stat.number}
                        </h2>
                        <p style={{
                            fontSize: '16px',
                            color: 'var(--text-secondary)',
                            fontWeight: '500'
                        }}>
                            {stat.label}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* Story */}
            <motion.div
                style={{
                    background: 'var(--bg-card)',
                    padding: '50px',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    maxWidth: '900px',
                    margin: '0 auto'
                }}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
            >
                <h2 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    marginBottom: '25px',
                    color: 'var(--text-primary)'
                }}>
                    Câu Chuyện Của Chúng Tôi
                </h2>

                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.9',
                    color: 'var(--text-secondary)',
                    marginBottom: '20px'
                }}>
                    Ra đời năm 2020, <strong>Shopee Fashion</strong> được xây dựng với sứ mệnh mang đến trải nghiệm mua sắm thời trang hiện đại, tiện lợi và độc đáo cho người Việt Nam. Chúng tôi không chỉ bán sản phẩm, mà còn tạo ra những trải nghiệm mua sắm đáng nhớ.
                </p>

                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.9',
                    color: 'var(--text-secondary)',
                    marginBottom: '20px'
                }}>
                    Với công nghệ <strong>Virtual Try-On 3D</strong> tiên tiến, khách hàng có thể "thử đồ" trực tuyến trước khi mua - một bước đột phá trong ngành thời trang điện tử. Điều này giúp giảm thiểu tỉ lệ đổi trả và tăng sự hài lòng của khách hàng.
                </p>

                <p style={{
                    fontSize: '16px',
                    lineHeight: '1.9',
                    color: 'var(--text-secondary)'
                }}>
                    Đội ngũ của chúng tôi bao gồm các chuyên gia về thời trang, công nghệ và dịch vụ khách hàng - tất cả cùng chung một mục tiêu: <em>"Mang phong cách đến mọi nhà"</em>.
                </p>

                <div style={{
                    marginTop: '35px',
                    padding: '25px',
                    background: 'var(--accent-gradient)',
                    borderRadius: 'var(--radius-md)',
                    color: 'white',
                    textAlign: 'center'
                }}>
                    <p style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        fontStyle: 'italic'
                    }}>
                        "Thời trang không chỉ là cách bạn mặc, mà là cách bạn sống"
                    </p>
                    <p style={{
                        fontSize: '14px',
                        marginTop: '10px',
                        opacity: 0.9
                    }}>
                        - Shopee Fashion Team
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default AboutPage;
