import React from 'react';

/**
 * OutfitPreview – shows a preview of the virtual try-on outfit
 * If no snapshot is available, shows a placeholder illustration.
 */
export default function OutfitPreview({ outfitSnapshot, outfitItems }) {
    if (!outfitItems || outfitItems.length === 0) return null;

    return (
        <div className="co-outfit">
            <p className="co-outfit__title">👗 Outfit bạn đã phối</p>

            {outfitSnapshot ? (
                <img
                    className="co-outfit__snapshot"
                    src={outfitSnapshot}
                    alt="Virtual Try-On Outfit Preview"
                />
            ) : (
                <div className="co-outfit__thumbs">
                    {outfitItems.slice(0, 4).map((item, i) => (
                        <div className="co-outfit__thumb" key={i}>
                            <img
                                src={
                                    item.image ||
                                    item.images?.[0] ||
                                    'https://via.placeholder.com/64x80?text=?'
                                }
                                alt={item.name || 'item'}
                            />
                        </div>
                    ))}
                    {outfitItems.length > 4 && (
                        <span className="co-outfit__more">+{outfitItems.length - 4}</span>
                    )}
                </div>
            )}
        </div>
    );
}
