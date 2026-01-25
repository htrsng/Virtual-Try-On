import React from 'react';
import { motion } from 'framer-motion';
import { FiPackage, FiTruck, FiCheck, FiAlertCircle } from 'react-icons/fi';

function PolicyPage() {
    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    const policies = [
        {
            icon: <FiPackage size={28} />,
            title: "Chính Sách Đổi Trả",
            content: [
                "Đổi trả trong vòng 7 ngày kể từ ngày nhận hàng",
                "Sản phẩm còn nguyên tem mác, chưa qua sử dụng",
                "Miễn phí đổi size nếu không vừa",
                "Hoàn tiền 100% nếu sản phẩm lỗi do nhà sản xuất"
            ]
        },
        {
            icon: <FiTruck size={28} />,
            title: "Chính Sách Vận Chuyển",
            content: [
                "Miễn phí ship cho đơn hàng từ 300.000đ",
                "Giao hàng nội thành: 1-2 ngày",
                "Giao hàng ngoại thành: 3-5 ngày",
                "Kiểm tra hàng trước khi thanh toán (COD)"
            ]
        },
        {
            icon: <FiCheck size={28} />,
            title: "Chính Sách Thanh Toán",
            content: [
                "Thanh toán khi nhận hàng (COD)",
                "Chuyển khoản ngân hàng",
                "Ví điện tử: MoMo, ZaloPay, VNPay",
                "Thẻ ATM/Visa/Mastercard - Bảo mật SSL"
            ]
        },
        {
            icon: <FiAlertCircle size={28} />,
            title: "Chính Sách Bảo Mật",
            content: [
                "Thông tin khách hàng được mã hóa và bảo mật tuyệt đối",
                "Không chia sẻ thông tin với bên thứ ba",
                "Tuân thủ luật bảo vệ dữ liệu cá nhân Việt Nam",
                "Khách hàng có quyền yêu cầu xóa dữ liệu cá nhân"
            ]
        }
    ];

    return (
        <motion.div
            className="container"
            style={{ marginTop: '30px', marginBottom: '50px' }}
            variants={pageVariants}
            initial="initial"
            animate="animate"
        >
            <h1 style={{
                fontSize: '36px',
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: '50px',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
            }}>
                Chính Sách & Điều Khoản
            </h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px',
                marginBottom: '50px'
            }}>
                {policies.map((policy, idx) => (
                    <motion.div
                        key={idx}
                        style={{
                            background: 'var(--bg-card)',
                            padding: '35px',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-md)',
                            border: '2px solid transparent',
                            transition: 'all var(--transition-base)'
                        }}
                        whileHover={{
                            scale: 1.02,
                            boxShadow: 'var(--shadow-colored)',
                            borderColor: 'var(--accent-primary)'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            marginBottom: '25px'
                        }}>
                            <div style={{
                                padding: '15px',
                                background: 'var(--accent-gradient)',
                                borderRadius: 'var(--radius-md)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {policy.icon}
                            </div>
                            <h2 style={{
                                fontSize: '22px',
                                fontWeight: '700',
                                color: 'var(--text-primary)'
                            }}>
                                {policy.title}
                            </h2>
                        </div>

                        <ul style={{
                            listStyle: 'none',
                            padding: 0,
                            margin: 0
                        }}>
                            {policy.content.map((item, i) => (
                                <li key={i} style={{
                                    padding: '12px 0',
                                    borderBottom: i < policy.content.length - 1 ? '1px solid var(--bg-tertiary)' : 'none',
                                    display: 'flex',
                                    alignItems: 'start',
                                    gap: '12px',
                                    fontSize: '15px',
                                    color: 'var(--text-secondary)',
                                    lineHeight: '1.6'
                                }}>
                                    <span style={{
                                        color: 'var(--accent-primary)',
                                        fontWeight: '700',
                                        fontSize: '18px',
                                        flexShrink: 0
                                    }}>
                                        •
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>

            {/* Terms & Conditions */}
            <motion.div
                style={{
                    background: 'var(--bg-card)',
                    padding: '50px',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: 'var(--shadow-lg)',
                    maxWidth: '900px',
                    margin: '0 auto'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    marginBottom: '25px',
                    color: 'var(--text-primary)'
                }}>
                    Điều Khoản Sử Dụng
                </h2>

                <div style={{
                    fontSize: '15px',
                    lineHeight: '1.8',
                    color: 'var(--text-secondary)'
                }}>
                    <p style={{ marginBottom: '20px' }}>
                        Khi truy cập và sử dụng website Shopee Fashion, bạn đồng ý tuân thủ các điều khoản và điều kiện sau:
                    </p>

                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginTop: '25px',
                        marginBottom: '15px',
                        color: 'var(--text-primary)'
                    }}>
                        1. Quyền Sở Hữu Trí Tuệ
                    </h3>
                    <p style={{ marginBottom: '20px' }}>
                        Toàn bộ nội dung, hình ảnh, logo, và thương hiệu trên website thuộc quyền sở hữu của Shopee Fashion. Nghiêm cấm sao chép, phân phối hoặc sử dụng cho mục đích thương mại mà không có sự cho phép.
                    </p>

                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginTop: '25px',
                        marginBottom: '15px',
                        color: 'var(--text-primary)'
                    }}>
                        2. Trách Nhiệm Người Dùng
                    </h3>
                    <p style={{ marginBottom: '20px' }}>
                        Người dùng cam kết cung cấp thông tin chính xác khi đăng ký, không sử dụng website cho các mục đích bất hợp pháp, không xâm phạm quyền lợi của người khác.
                    </p>

                    <h3 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        marginTop: '25px',
                        marginBottom: '15px',
                        color: 'var(--text-primary)'
                    }}>
                        3. Giới Hạn Trách Nhiệm
                    </h3>
                    <p style={{ marginBottom: '20px' }}>
                        Shopee Fashion không chịu trách nhiệm về bất kỳ thiệt hại trực tiếp, gián tiếp, ngẫu nhiên hoặc hậu quả phát sinh từ việc sử dụng hoặc không thể sử dụng website.
                    </p>

                    <div style={{
                        marginTop: '35px',
                        padding: '25px',
                        background: 'var(--accent-gradient)',
                        borderRadius: 'var(--radius-md)',
                        color: 'white',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontWeight: '600' }}>
                            Có thắc mắc về chính sách?
                        </p>
                        <p style={{ marginTop: '10px' }}>
                            Liên hệ: <strong>support@shopeefashion.vn</strong> hoặc <strong>1900 9999</strong>
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default PolicyPage;
