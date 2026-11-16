import OutfitCard from './OutfitCard'
import type { OutfitResult } from '../../types/outfit'

interface ResultPanelProps {
    outfits: OutfitResult[]
    activeIndex: number
    onTryOn: (outfit: OutfitResult, index: number) => void
    onSelectOutfit: (index: number) => void
}

export default function ResultPanel({ outfits, activeIndex, onTryOn, onSelectOutfit }: ResultPanelProps) {
    const headerStyle: React.CSSProperties = {
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        color: '#6b7280',
        padding: '12px 16px',
        borderBottom: '1px solid #f3f4f6',
        backgroundColor: '#fafafa',
    }

    const bodyStyle: React.CSSProperties = {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        scrollBehavior: 'smooth',
        WebkitOverflowScrolling: 'touch',
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#fff' }}>
            <div style={headerStyle}>
                Gợi ý AI — {outfits.length} outfit
            </div>

            <div style={bodyStyle}>
                {outfits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 12px', color: '#94a3b8' }}>
                        <p style={{ fontSize: 12, margin: 0 }}>Nhập mô tả hoặc chọn dịp để AI gợi ý outfit</p>
                    </div>
                ) : (
                    <>
                        {outfits.map((outfit, index) => (
                            <OutfitCard
                                key={outfit.id}
                                outfit={outfit}
                                index={index}
                                isActive={index === activeIndex}
                                onTryOn={() => onTryOn(outfit, index)}
                                onSelectOutfit={() => onSelectOutfit(index)}
                            />
                        ))}
                    </>
                )}
            </div>
        </div>
    )
}
