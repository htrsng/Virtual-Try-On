import type { OutfitResult, OutfitItem } from '../../types/outfit'

interface OutfitCardProps {
    outfit: OutfitResult
    index: number
    isActive: boolean
    onTryOn: () => void
    onSelectOutfit: () => void
}

export default function OutfitCard({ outfit, index, isActive, onTryOn, onSelectOutfit }: OutfitCardProps) {
    const sortedItems = [...outfit.items].sort((a, b) => {
        // Items to buy (owned === false) appear first, then owned items
        if (a.owned === b.owned) return 0
        return a.owned ? 1 : -1
    })

    const ownedCount = outfit.items.filter(item => item.owned).length
    const totalCount = outfit.items.length
    const totalBuyPrice = outfit.items
        .filter(item => !item.owned)
        .reduce((sum, item) => sum + (item.price || 0), 0)

    const cardStyle: React.CSSProperties = {
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        backgroundColor: '#fff',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
    }

    const headerStyle: React.CSSProperties = {
        padding: '10px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: isActive ? '1px solid #f3f4f6' : 'none',
        backgroundColor: isActive ? '#f9fafb' : '#fff',
    }

    const headerLeftStyle: React.CSSProperties = {
        fontSize: 12,
        fontWeight: 500,
        color: '#0f172a',
    }

    const occasionBadgeStyle: React.CSSProperties = {
        fontSize: 10,
        backgroundColor: '#ede9fe',
        color: '#5b21b6',
        padding: '3px 8px',
        borderRadius: 10,
        fontWeight: 500,
    }

    const productListStyle: React.CSSProperties = {
        display: 'flex',
        flexDirection: 'column',
    }

    const productItemStyle: React.CSSProperties = {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        padding: '8px 10px',
        borderBottom: '0.5px solid #f3f4f6',
    }

    const productImageStyle: React.CSSProperties = {
        width: 48,
        height: 48,
        borderRadius: 6,
        objectFit: 'cover',
        flexShrink: 0,
    }

    const productInfoStyle: React.CSSProperties = {
        flex: 1,
        minWidth: 0,
    }

    const productNameStyle: React.CSSProperties = {
        fontSize: 11,
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        color: '#0f172a',
    }

    const productPriceStyle: React.CSSProperties = {
        fontSize: 11,
        color: '#6b7280',
        marginTop: 2,
    }

    const badgesStyle: React.CSSProperties = {
        display: 'flex',
        gap: 4,
        marginTop: 3,
        flexWrap: 'wrap',
    }

    const sizeBadgeStyle: React.CSSProperties = {
        fontSize: 9,
        padding: '2px 6px',
        borderRadius: 8,
        backgroundColor: '#14532d',
        color: '#fff',
        fontWeight: 500,
    }

    const ownedBadgeStyle: React.CSSProperties = {
        fontSize: 9,
        padding: '2px 6px',
        borderRadius: 8,
        backgroundColor: '#dcfce7',
        color: '#166534',
        fontWeight: 500,
    }

    const needBuyBadgeStyle: React.CSSProperties = {
        fontSize: 9,
        padding: '2px 6px',
        borderRadius: 8,
        backgroundColor: '#fff7ed',
        color: '#c2410c',
        fontWeight: 500,
    }

    const footerStyle: React.CSSProperties = {
        padding: '10px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #f3f4f6',
        backgroundColor: '#f9fafb',
    }

    const footerLeftStyle: React.CSSProperties = {
        fontSize: 10,
        color: '#6b7280',
    }

    const tryOnButtonStyle: React.CSSProperties = {
        fontSize: 10,
        fontWeight: 500,
        backgroundColor: '#1a1a1a',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '5px 10px',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
    }

    const expandedButtonHoverStyle: React.CSSProperties = {
        ...tryOnButtonStyle,
        backgroundColor: '#2a2a2a',
    }

    const collapsedSummaryStyle: React.CSSProperties = {
        padding: '8px 12px',
        fontSize: 10,
        color: '#6b7280',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    }

    const viewDetailsButtonStyle: React.CSSProperties = {
        fontSize: 10,
        fontWeight: 500,
        backgroundColor: '#f3f4f6',
        color: '#475569',
        border: 'none',
        borderRadius: 8,
        padding: '5px 10px',
        cursor: 'pointer',
        transition: 'background 0.2s ease',
    }

    if (!isActive) {
        // Collapsed view
        return (
            <div style={cardStyle}>
                <div style={headerStyle}>
                    <div style={headerLeftStyle}>{outfit.name}</div>
                    <div style={occasionBadgeStyle}>{outfit.stats?.ownedCount || 0}/{totalCount}</div>
                </div>

                <div style={collapsedSummaryStyle}>
                    <span>
                        {sortedItems.length} sản phẩm · Cần mua: {totalBuyPrice.toLocaleString('vi-VN')}đ
                    </span>
                    <button
                        onClick={onSelectOutfit}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e5e7eb'
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6'
                        }}
                        style={viewDetailsButtonStyle}
                    >
                        Xem chi tiết
                    </button>
                </div>
            </div>
        )
    }

    // Expanded view
    return (
        <div style={cardStyle}>
            {/* Header */}
            <div style={headerStyle}>
                <div style={headerLeftStyle}>{outfit.name}</div>
                <div style={occasionBadgeStyle}>{outfit.occasion || 'Outfit'}</div>
            </div>

            {/* Product List */}
            <div style={productListStyle}>
                {sortedItems.map((item) => (
                    <div key={item.id} style={productItemStyle}>
                        <img
                            src={item.imageUrl}
                            alt={item.name}
                            width={48}
                            height={48}
                            style={productImageStyle}
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.png'
                            }}
                        />
                        <div style={productInfoStyle}>
                            <div style={productNameStyle}>{item.name}</div>
                            <div style={productPriceStyle}>{(item.price || 0).toLocaleString('vi-VN')}đ</div>
                            <div style={badgesStyle}>
                                {item.suggestedSize && (
                                    <span style={sizeBadgeStyle} title={item.sizeReason}>
                                        Size {item.suggestedSize}
                                    </span>
                                )}
                                {item.owned ? (
                                    <span style={ownedBadgeStyle}>✓ Đã có trong tủ</span>
                                ) : (
                                    <span style={needBuyBadgeStyle}>🛒 Cần mua</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div style={footerStyle}>
                <div style={footerLeftStyle}>
                    Có {ownedCount}/{totalCount} món · Cần mua: {totalBuyPrice.toLocaleString('vi-VN')}đ
                </div>
                <button
                    onClick={onTryOn}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#2a2a2a'
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#1a1a1a'
                    }}
                    style={tryOnButtonStyle}
                >
                    Thử bộ
                </button>
            </div>
        </div>
    )
}
