// Voucher Data - Giả lập Shopee
export const voucherList = [
    {
        id: 1,
        code: 'FREESHIP',
        name: 'Miễn phí vận chuyển',
        description: 'Miễn phí vận chuyển cho đơn trên 100.000đ',
        discountType: 'shipping', // shipping | percentage | fixed
        discountValue: 100000, // Vận chuyển miễn phí
        minAmount: 100000,
        maxDiscount: 100000,
        usageLimit: 9999,
        expiryDate: new Date(2026, 11, 31),
        badge: '🚚',
        color: '#ff6b6b',
        restrictions: 'Áp dụng cho đơn từ 100.000đ trở lên'
    },
    {
        id: 2,
        code: 'SAVE10',
        name: 'Giảm 10%',
        description: 'Giảm 10% cho tất cả sản phẩm',
        discountType: 'percentage',
        discountValue: 10, // 10%
        minAmount: 50000,
        maxDiscount: 50000,
        usageLimit: 100,
        expiryDate: new Date(2026, 11, 31),
        badge: '💰',
        color: '#4ecdc4',
        restrictions: 'Giảm tối đa 50.000đ, áp dụng từ 50.000đ'
    },
    {
        id: 3,
        code: 'SAVE20',
        name: 'Giảm 20%',
        description: 'Giảm ngay 20% hôm nay',
        discountType: 'percentage',
        discountValue: 20, // 20%
        minAmount: 100000,
        maxDiscount: 100000,
        usageLimit: 50,
        expiryDate: new Date(2026, 11, 31),
        badge: '🎉',
        color: '#ffd93d',
        restrictions: 'Giảm tối đa 100.000đ, áp dụng từ 100.000đ'
    },
    {
        id: 4,
        code: 'SAVE30',
        name: 'Giảm 30%',
        description: 'Khuyến mãi đặc biệt - Giảm 30%',
        discountType: 'percentage',
        discountValue: 30, // 30%
        minAmount: 200000,
        maxDiscount: 150000,
        usageLimit: 20,
        expiryDate: new Date(2026, 11, 31),
        badge: '⚡',
        color: '#ff006e',
        restrictions: 'Giảm tối đa 150.000đ, áp dụng từ 200.000đ'
    },
    {
        id: 5,
        code: 'NEWBIE100',
        name: 'Voucher khách mới',
        description: 'Giảm ngay 100.000đ cho hóa đơn đầu tiên',
        discountType: 'fixed',
        discountValue: 100000, // 100.000đ
        minAmount: 300000,
        maxDiscount: 100000,
        usageLimit: 1,
        expiryDate: new Date(2026, 11, 31),
        badge: '🎁',
        color: '#a8dadc',
        restrictions: 'Chỉ dành cho khách hàng mới, áp dụng từ 300.000đ'
    },
    {
        id: 6,
        code: 'FLASH50K',
        name: 'Flash Sale - Giảm 50K',
        description: 'Giảm 50.000đ - Flash sale hàng giờ',
        discountType: 'fixed',
        discountValue: 50000, // 50.000đ
        minAmount: 100000,
        maxDiscount: 50000,
        usageLimit: 200,
        expiryDate: new Date(2026, 11, 31),
        badge: '🔥',
        color: '#ff6b35',
        restrictions: 'Áp dụng từ 100.000đ, hạn chế số lượng'
    },
    {
        id: 7,
        code: 'VIP15',
        name: 'Thành viên VIP - 15%',
        description: 'Giảm 15% cho thành viên VIP',
        discountType: 'percentage',
        discountValue: 15, // 15%
        minAmount: 80000,
        maxDiscount: 80000,
        usageLimit: 999,
        expiryDate: new Date(2026, 11, 31),
        badge: '👑',
        color: '#d4af37',
        restrictions: 'Dành cho thành viên VIP, giảm tối đa 80.000đ'
    },
    {
        id: 8,
        code: 'WEEKEND25',
        name: 'Cuối tuần - Giảm 25%',
        description: 'Giảm 25% vào cuối tuần',
        discountType: 'percentage',
        discountValue: 25, // 25%
        minAmount: 150000,
        maxDiscount: 120000,
        usageLimit: 300,
        expiryDate: new Date(2026, 11, 31),
        badge: '🌟',
        color: '#6bcf7f',
        restrictions: 'Áp dụng cuối tuần, giảm tối đa 120.000đ'
    },
    {
        id: 9,
        code: 'STUDENT200',
        name: 'Sinh viên - Giảm 200K',
        description: 'Sinh viên giảm thêm 200.000đ',
        discountType: 'fixed',
        discountValue: 200000, // 200.000đ
        minAmount: 500000,
        maxDiscount: 200000,
        usageLimit: 50,
        expiryDate: new Date(2026, 11, 31),
        badge: '🎓',
        color: '#4361ee',
        restrictions: 'Dành cho sinh viên, áp dụng từ 500.000đ'
    },
    {
        id: 10,
        code: 'BIRTHDAY50',
        name: 'Sinh nhật - Giảm 50%',
        description: 'Tặng giảm 50% vào ngày sinh nhật của bạn',
        discountType: 'percentage',
        discountValue: 50, // 50%
        minAmount: 200000,
        maxDiscount: 200000,
        usageLimit: 1,
        expiryDate: new Date(2026, 11, 31),
        badge: '🎂',
        color: '#f72585',
        restrictions: 'Dành cho khách hàng sinh nhật, giảm tối đa 200.000đ'
    }
];

const MANAGED_VOUCHERS_STORAGE_KEY = 'managedVouchers';

const toDateString = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return new Date().toISOString().slice(0, 10);
    }
    return date.toISOString().slice(0, 10);
};

const normalizeManagedVoucher = (voucher, fallbackId) => ({
    id: voucher.id ?? fallbackId,
    code: String(voucher.code || '').toUpperCase(),
    name: voucher.name || '',
    type: voucher.type || 'percentage',
    value: Number(voucher.value ?? 0),
    minAmount: Number(voucher.minAmount ?? 0),
    maxDiscount: Number(voucher.maxDiscount ?? 0),
    usageLimit: Number(voucher.usageLimit ?? 0),
    usageCount: Number(voucher.usageCount ?? 0),
    startDate: toDateString(voucher.startDate || new Date()),
    endDate: toDateString(voucher.endDate || new Date()),
    status: voucher.status || 'active',
    description: voucher.description || '',
    badge: voucher.badge || '🎟️',
    color: voucher.color || '#4ecdc4',
    restrictions: voucher.restrictions || 'Áp dụng theo điều kiện đơn hàng'
});

const seedManagedVouchers = () => {
    const seeded = voucherList.map((voucher, index) => normalizeManagedVoucher({
        id: voucher.id,
        code: voucher.code,
        name: voucher.name,
        type: voucher.discountType,
        value: voucher.discountValue,
        minAmount: voucher.minAmount,
        maxDiscount: voucher.maxDiscount,
        usageLimit: voucher.usageLimit,
        usageCount: 0,
        startDate: new Date(),
        endDate: voucher.expiryDate,
        status: 'active',
        description: voucher.description,
        badge: voucher.badge,
        color: voucher.color,
        restrictions: voucher.restrictions
    }, index + 1));

    if (typeof window !== 'undefined') {
        localStorage.setItem(MANAGED_VOUCHERS_STORAGE_KEY, JSON.stringify(seeded));
    }

    return seeded;
};

export const getManagedVouchers = () => {
    if (typeof window === 'undefined') {
        return voucherList.map((voucher, index) => normalizeManagedVoucher({
            id: voucher.id,
            code: voucher.code,
            name: voucher.name,
            type: voucher.discountType,
            value: voucher.discountValue,
            minAmount: voucher.minAmount,
            maxDiscount: voucher.maxDiscount,
            usageLimit: voucher.usageLimit,
            usageCount: 0,
            startDate: new Date(),
            endDate: voucher.expiryDate,
            status: 'active',
            description: voucher.description,
            badge: voucher.badge,
            color: voucher.color,
            restrictions: voucher.restrictions
        }, index + 1));
    }

    try {
        const raw = JSON.parse(localStorage.getItem(MANAGED_VOUCHERS_STORAGE_KEY) || '[]');
        if (!Array.isArray(raw) || raw.length === 0) {
            return seedManagedVouchers();
        }
        return raw.map((voucher, index) => normalizeManagedVoucher(voucher, index + 1));
    } catch {
        return seedManagedVouchers();
    }
};

export const setManagedVouchers = (vouchers) => {
    if (typeof window === 'undefined') return;

    const normalized = (Array.isArray(vouchers) ? vouchers : [])
        .map((voucher, index) => normalizeManagedVoucher(voucher, index + 1));

    localStorage.setItem(MANAGED_VOUCHERS_STORAGE_KEY, JSON.stringify(normalized));
    window.dispatchEvent(new Event('managedVouchersUpdated'));
};

export const getCustomerVouchers = () => {
    return getManagedVouchers().map(voucher => {
        const remainingUsage = Math.max(0, Number(voucher.usageLimit) - Number(voucher.usageCount));

        return {
            id: voucher.id,
            code: voucher.code,
            name: voucher.name,
            description: voucher.description,
            discountType: voucher.type,
            discountValue: Number(voucher.value),
            minAmount: Number(voucher.minAmount),
            maxDiscount: Number(voucher.maxDiscount),
            usageLimit: remainingUsage,
            startDate: new Date(voucher.startDate),
            expiryDate: new Date(voucher.endDate),
            status: voucher.status,
            badge: voucher.badge,
            color: voucher.color,
            restrictions: voucher.restrictions
        };
    });
};

// Hàm tính discount
export const calculateDiscount = (voucher, totalAmount) => {
    if (!voucher) return 0;

    // Kiểm tra điều kiện tối thiểu
    if (totalAmount < voucher.minAmount) {
        return 0;
    }

    let discount = 0;

    if (voucher.discountType === 'percentage') {
        discount = Math.floor((totalAmount * voucher.discountValue) / 100);
    } else if (voucher.discountType === 'fixed') {
        discount = voucher.discountValue;
    } else if (voucher.discountType === 'shipping') {
        discount = voucher.discountValue;
    }

    // Áp dụng giới hạn giảm tối đa
    discount = Math.min(discount, voucher.maxDiscount);

    return discount;
};

// Hàm kiểm tra voucher còn hiệu lực không
export const isVoucherValid = (voucher) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (voucher.status && voucher.status !== 'active') {
        return false;
    }

    if (voucher.startDate) {
        const startDate = new Date(voucher.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (startDate > today) {
            return false;
        }
    }

    const expiryDate = new Date(voucher.expiryDate);
    expiryDate.setHours(0, 0, 0, 0);

    return expiryDate >= today && Number(voucher.usageLimit) > 0;
};

// Hàm format voucher để hiển thị
export const formatVoucherDisplay = (voucher, discount) => {
    let displayText = '';

    if (voucher.discountType === 'percentage') {
        displayText = `Giảm ${voucher.discountValue}%`;
    } else if (voucher.discountType === 'fixed') {
        displayText = `Giảm ${voucher.discountValue.toLocaleString('vi-VN')}đ`;
    } else if (voucher.discountType === 'shipping') {
        displayText = 'Miễn phí vận chuyển';
    }

    return displayText;
};
