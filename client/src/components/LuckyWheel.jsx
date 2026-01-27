import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

function LuckyWheel({ onWinCoupon }) {
    const [showWheel, setShowWheel] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState(null);
    const [confetti, setConfetti] = useState([]);
    const canvasRef = useRef(null);

    const prizes = [
        { id: 1, label: '10%', code: 'GIAM10', color: ['#FF6B6B', '#FF8E8E'], angle: 0 },
        { id: 2, label: '15%', code: 'GIAM15', color: ['#4ECDC4', '#6FE5DD'], angle: 60 },
        { id: 3, label: '20%', code: 'GIAM20', color: ['#45B7D1', '#6BC5E0'], angle: 120 },
        { id: 4, label: '30%', code: 'GIAM30', color: ['#FFA07A', '#FFB599'], angle: 180 },
        { id: 5, label: '😢', code: null, color: ['#95E1D3', '#ABECE0'], angle: 240 },
        { id: 6, label: '50%', code: 'GIAM50', color: ['#FF8B94', '#FFA5AE'], angle: 300 }
    ];

    // Draw wheel on canvas
    useEffect(() => {
        if (showWheel && canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radius = Math.min(centerX, centerY) - 10;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw segments
            prizes.forEach((prize, index) => {
                const startAngle = (prize.angle * Math.PI) / 180;
                const endAngle = ((prize.angle + 60) * Math.PI) / 180;

                // Create gradient
                const gradient = ctx.createLinearGradient(
                    centerX + Math.cos(startAngle) * radius,
                    centerY + Math.sin(startAngle) * radius,
                    centerX + Math.cos(endAngle) * radius,
                    centerY + Math.sin(endAngle) * radius
                );
                gradient.addColorStop(0, prize.color[0]);
                gradient.addColorStop(1, prize.color[1]);

                // Draw segment
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, startAngle, endAngle);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();

                // Draw border
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Draw text
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(startAngle + (endAngle - startAngle) / 2);
                ctx.textAlign = 'center';
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 24px Arial';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                ctx.shadowBlur = 5;
                ctx.fillText(prize.label, radius * 0.65, 10);
                ctx.restore();
            });

            // Draw center circle with 3D effect
            const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 40);
            centerGradient.addColorStop(0, '#FFD700');
            centerGradient.addColorStop(0.5, '#FFA500');
            centerGradient.addColorStop(1, '#FF8C00');

            ctx.beginPath();
            ctx.arc(centerX, centerY, 40, 0, Math.PI * 2);
            ctx.fillStyle = centerGradient;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.stroke();

            // Draw icon in center
            ctx.font = 'bold 30px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🎯', centerX, centerY);
        }
    }, [showWheel, prizes]);

    // Generate confetti
    const generateConfetti = () => {
        const newConfetti = [];
        for (let i = 0; i < 100; i++) {
            newConfetti.push({
                id: i,
                x: Math.random() * window.innerWidth,
                y: -20,
                color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#95E1D3', '#FFD700'][Math.floor(Math.random() * 6)],
                size: Math.random() * 8 + 4,
                speedX: Math.random() * 4 - 2,
                speedY: Math.random() * 5 + 2,
                rotation: Math.random() * 360
            });
        }
        setConfetti(newConfetti);

        // Clear confetti after animation
        setTimeout(() => setConfetti([]), 4000);
    };

    const handleSpin = () => {
        if (isSpinning) return;

        setIsSpinning(true);
        setResult(null);

        // Random prize
        const randomIndex = Math.floor(Math.random() * prizes.length);
        const targetPrize = prizes[randomIndex];

        // Tính toán góc quay: 8 vòng + góc đích
        // Mũi tên ở trên cùng (góc 0 độ), vòng quay theo chiều kim đồng hồ
        // Cần quay để giải thưởng nằm ở vị trí mũi tên (trên cùng)
        const spins = 8;
        const baseAngle = targetPrize.angle;
        // Mũi tên chỉ giữa ô (cộng thêm 30 độ để vào giữa ô 60 độ)
        const targetAngle = 360 - baseAngle + 30;
        const totalRotation = rotation + (spins * 360) + targetAngle;

        setRotation(totalRotation);

        setTimeout(() => {
            setIsSpinning(false);
            setResult(targetPrize);

            if (targetPrize.code) {
                generateConfetti();

                // Save to localStorage
                const existingCoupons = JSON.parse(localStorage.getItem('myCoupons') || '[]');
                console.log('🎰 Mã cũ:', existingCoupons);
                if (!existingCoupons.includes(targetPrize.code)) {
                    existingCoupons.push(targetPrize.code);
                    localStorage.setItem('myCoupons', JSON.stringify(existingCoupons));
                    console.log('✅ Đã lưu mã mới:', targetPrize.code);
                    console.log('📋 Danh sách hiện tại:', existingCoupons);

                    // Dispatch event để CheckoutPage cập nhật
                    window.dispatchEvent(new Event('couponUpdated'));
                    console.log('📢 Đã gửi event couponUpdated');
                }

                if (onWinCoupon) {
                    onWinCoupon(targetPrize.code);
                }
            }
        }, 6000);
    };

    return (
        <>
            {/* Floating Button with pulse animation */}
            <motion.button
                animate={{
                    scale: [1, 1.1, 1],
                    boxShadow: [
                        '0 10px 30px rgba(255, 215, 0, 0.4)',
                        '0 10px 40px rgba(255, 215, 0, 0.6)',
                        '0 10px 30px rgba(255, 215, 0, 0.4)'
                    ]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWheel(true)}
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    right: '30px',
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                    border: '4px solid #fff',
                    cursor: 'pointer',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    color: 'white',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 30px rgba(255, 215, 0, 0.4)'
                }}
            >
                🎡
                <span style={{ fontSize: '10px', marginTop: '2px' }}>QUAY</span>
            </motion.button>

            {/* Confetti */}
            <AnimatePresence>
                {confetti.map((piece) => (
                    <motion.div
                        key={piece.id}
                        initial={{
                            x: piece.x,
                            y: piece.y,
                            opacity: 1,
                            rotate: piece.rotation
                        }}
                        animate={{
                            y: window.innerHeight + 100,
                            x: piece.x + piece.speedX * 100,
                            rotate: piece.rotation + 360,
                            opacity: 0
                        }}
                        transition={{
                            duration: 3,
                            ease: "linear"
                        }}
                        style={{
                            position: 'fixed',
                            width: piece.size,
                            height: piece.size,
                            backgroundColor: piece.color,
                            borderRadius: '2px',
                            zIndex: 10001,
                            pointerEvents: 'none'
                        }}
                    />
                ))}
            </AnimatePresence>

            {/* Modal */}
            <AnimatePresence>
                {showWheel && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.85)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999,
                            padding: '20px'
                        }}
                        onClick={() => !isSpinning && setShowWheel(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.5, y: 100, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.5, y: 100, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: '30px',
                                padding: '50px',
                                maxWidth: '650px',
                                width: '100%',
                                textAlign: 'center',
                                position: 'relative',
                                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.5)',
                                border: '3px solid rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            {/* Close button */}
                            <button
                                onClick={() => setShowWheel(false)}
                                style={{
                                    position: 'absolute',
                                    top: '20px',
                                    right: '20px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '40px',
                                    height: '40px',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                            >
                                ✕
                            </button>

                            {/* Title */}
                            <motion.h2
                                animate={{
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                style={{
                                    fontSize: '36px',
                                    marginBottom: '10px',
                                    color: '#FFD700',
                                    textShadow: '0 4px 20px rgba(255, 215, 0, 0.5), 0 0 40px rgba(255, 215, 0, 0.3)',
                                    fontWeight: 'bold',
                                    letterSpacing: '2px'
                                }}
                            >
                                🎰 VÒNG QUAY MAY MẮN 🎰
                            </motion.h2>
                            <p style={{
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '16px',
                                marginBottom: '30px',
                                fontWeight: '500'
                            }}>
                                Quay để nhận mã giảm giá siêu hấp dẫn!
                            </p>

                            {/* Wheel Container */}
                            <div style={{
                                position: 'relative',
                                width: '400px',
                                height: '400px',
                                margin: '0 auto 30px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                filter: 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.4))'
                            }}>
                                {/* Arrow pointer with glow */}
                                <motion.div
                                    animate={{
                                        y: [0, -10, 0],
                                        filter: [
                                            'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))',
                                            'drop-shadow(0 0 20px rgba(255, 215, 0, 1))',
                                            'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))'
                                        ]
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '-20px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: 0,
                                        height: 0,
                                        borderLeft: '20px solid transparent',
                                        borderRight: '20px solid transparent',
                                        borderTop: '40px solid #FFD700',
                                        zIndex: 10,
                                    }}
                                />

                                {/* Wheel with canvas */}
                                <motion.div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        position: 'relative',
                                        background: 'white',
                                        boxShadow: '0 0 0 10px rgba(255, 255, 255, 0.2), 0 0 50px rgba(255, 215, 0, 0.5), inset 0 0 50px rgba(0, 0, 0, 0.1)',
                                        transform: `rotate(${rotation}deg)`,
                                        transition: isSpinning ? 'transform 6s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                                    }}
                                >
                                    <canvas
                                        ref={canvasRef}
                                        width={400}
                                        height={400}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%'
                                        }}
                                    />
                                </motion.div>
                            </div>

                            {/* Spin Button */}
                            <motion.button
                                whileHover={{ scale: 1.08, boxShadow: '0 15px 40px rgba(255, 215, 0, 0.5)' }}
                                whileTap={{ scale: 0.95 }}
                                disabled={isSpinning}
                                onClick={handleSpin}
                                style={{
                                    padding: '18px 60px',
                                    fontSize: '22px',
                                    fontWeight: 'bold',
                                    background: isSpinning
                                        ? 'linear-gradient(135deg, #999 0%, #666 100%)'
                                        : 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FF8C00 100%)',
                                    color: 'white',
                                    border: '4px solid #fff',
                                    borderRadius: '30px',
                                    cursor: isSpinning ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 10px 30px rgba(255, 215, 0, 0.4)',
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                                    letterSpacing: '1px'
                                }}
                            >
                                {isSpinning ? '🎡 ĐANG QUAY...' : '🎰 QUAY NGAY!'}
                            </motion.button>

                            {/* Result */}
                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                        style={{
                                            marginTop: '30px',
                                            padding: '25px',
                                            borderRadius: '20px',
                                            background: result.code
                                                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                                                : 'linear-gradient(135deg, #95E1D3 0%, #8fd3f4 100%)',
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            color: '#fff',
                                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                                            border: '3px solid rgba(255, 255, 255, 0.5)'
                                        }}
                                    >
                                        {result.code ? (
                                            <>
                                                <motion.div
                                                    animate={{ rotate: [0, 10, -10, 0] }}
                                                    transition={{ duration: 0.5, repeat: 3 }}
                                                    style={{ fontSize: '50px', marginBottom: '15px' }}
                                                >
                                                    🎉
                                                </motion.div>
                                                <div style={{ fontSize: '24px', marginBottom: '10px', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                                                    CHÚC MỪNG BẠN!
                                                </div>
                                                <div style={{ fontSize: '18px', marginBottom: '15px' }}>
                                                    Nhận được mã giảm giá
                                                </div>
                                                <motion.div
                                                    animate={{ scale: [1, 1.1, 1] }}
                                                    transition={{ duration: 1, repeat: Infinity }}
                                                    style={{
                                                        fontSize: '36px',
                                                        background: 'rgba(255, 255, 255, 0.9)',
                                                        color: '#FF4500',
                                                        padding: '15px 30px',
                                                        borderRadius: '15px',
                                                        marginTop: '15px',
                                                        letterSpacing: '3px',
                                                        boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {result.code}
                                                </motion.div>
                                                <div style={{ fontSize: '14px', marginTop: '15px', opacity: 0.9 }}>
                                                    ✨ Mã đã được lưu vào tài khoản! ✨
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{ fontSize: '50px', marginBottom: '15px' }}>😢</div>
                                                <div style={{ fontSize: '20px', marginBottom: '10px' }}>Chúc bạn may mắn lần sau!</div>
                                                <div style={{ fontSize: '14px', marginTop: '10px', opacity: 0.9 }}>
                                                    Đừng buồn! Hãy tiếp tục mua sắm nhé! 💪
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default LuckyWheel;
