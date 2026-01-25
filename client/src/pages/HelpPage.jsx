import React from 'react';
import { motion } from 'framer-motion';
import { FiPhone, FiMail, FiMapPin, FiClock } from 'react-icons/fi';

function HelpPage() {
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    const helpSections = [
        {
            icon: <FiPhone size={24} />,
            title: "Hotline hỗ trợ",
            content: "1900 9999 (8:00 - 22:00)",
            subtext: "Miễn phí gọi"
        },
        {
            icon: <FiMail size={24} />,
            title: "Email",
            content: "support@shopeefashion.vn",
            subtext: "Phản hồi trong 24h"
        },
        {
            icon: <FiMapPin size={24} />,
            title: "Địa chỉ",
            content: "123 Đường Lê Lợi, Q.1, TP.HCM",
            subtext: "Trụ sở chính"
        },
        {
            icon: <FiClock size={24} />,
            title: "Giờ làm việc",
            content: "8:00 - 22:00 (Thứ 2 - CN)",
            subtext: "Tất cả các ngày trong tuần"
        }
    ];

    const faqs = [
        {
            question: "Làm thế nào để đặt hàng?",
            answer: "Chọn sản phẩm → Thêm vào giỏ hàng → Thanh toán → Hoàn tất đơn hàng"
        },
        {
            question: "Thời gian giao hàng bao lâu?",
            answer: "Nội thành: 1-2 ngày. Ngoại thành: 3-5 ngày. Miễn phí ship cho đơn từ 300k"
        },
        {
            question: "Chính sách đổi trả như thế nào?",
            answer: "Đổi trả trong 7 ngày nếu sản phẩm lỗi hoặc không đúng mô tả. Sản phẩm phải còn nguyên tem mác"
        },
        {
            question: "Có những hình thức thanh toán nào?",
            answer: "COD, chuyển khoản, ví điện tử (MoMo, ZaloPay), thẻ ATM/Visa/MasterCard"
        },
        {
            question: "Làm sao để kiểm tra đơn hàng?",
            answer: "Đăng nhập → Tài khoản → Đơn hàng của tôi. Hoặc liên hệ hotline với mã đơn hàng"
        }
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
                fontSize: '32px',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: '40px',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Trung Tâm Trợ Giúp
            </h1>

            {/* Contact Info */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '50px'
            }}>
                {helpSections.map((section, idx) => (
                    <motion.div
                        key={idx}
                        style={{
                            background: 'var(--bg-card)',
                            padding: '30px',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-md)',
                            textAlign: 'center',
                            transition: 'all var(--transition-base)',
                            border: '2px solid transparent'
                        }}
                        whileHover={{
                            scale: 1.03,
                            boxShadow: 'var(--shadow-colored)',
                            borderColor: 'var(--accent-primary)'
                        }}
                    >
                        <div style={{
                            display: 'inline-flex',
                            padding: '15px',
                            background: 'var(--accent-gradient)',
                            borderRadius: '50%',
                            color: 'white',
                            marginBottom: '15px'
                        }}>
                            {section.icon}
                        </div>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '10px',
                            color: 'var(--text-primary)'
                        }}>
                            {section.title}
                        </h3>
                        <p style={{
                            fontSize: '16px',
                            fontWeight: '500',
                            color: 'var(--text-secondary)',
                            marginBottom: '5px'
                        }}>
                            {section.content}
                        </p>
                        <p style={{
                            fontSize: '14px',
                            color: 'var(--text-tertiary)'
                        }}>
                            {section.subtext}
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* FAQs */}
            <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                marginBottom: '30px',
                textAlign: 'center',
                color: 'var(--text-primary)'
            }}>
                Câu Hỏi Thường Gặp
            </h2>

            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {faqs.map((faq, idx) => (
                    <motion.div
                        key={idx}
                        style={{
                            background: 'var(--bg-card)',
                            padding: '25px',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '20px',
                            boxShadow: 'var(--shadow-sm)',
                            border: '2px solid transparent',
                            transition: 'all var(--transition-base)'
                        }}
                        whileHover={{
                            boxShadow: 'var(--shadow-md)',
                            borderColor: 'var(--accent-primary)'
                        }}
                    >
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '12px',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            <span style={{
                                background: 'var(--accent-gradient)',
                                color: 'white',
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: '700'
                            }}>
                                {idx + 1}
                            </span>
                            {faq.question}
                        </h3>
                        <p style={{
                            fontSize: '15px',
                            color: 'var(--text-secondary)',
                            lineHeight: '1.7',
                            paddingLeft: '38px'
                        }}>
                            {faq.answer}
                        </p>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}

export default HelpPage;
