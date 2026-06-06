import type { Profile } from '../contexts/FittingRoomContext';
import type { ProductSizeMeasurement } from '../types/aiOutfit';

export interface SizeRecommendation {
    recommendedSize: string;
    fitScore: number;
}

export function calculateRecommendedSize(
    profile: Profile,
    sizeChart: ProductSizeMeasurement[] | undefined,
    layer: 'tops' | 'bottoms' | 'outerwear' | 'shoes' | 'dresses'
): SizeRecommendation {
    if (!sizeChart || sizeChart.length === 0) {
        // Fallback size if no size chart is available
        return { recommendedSize: 'M', fitScore: 80 };
    }

    if (layer === 'shoes') {
        // Body profile currently doesn't have foot size, fallback
        return { recommendedSize: '39', fitScore: 85 };
    }

    let bestSize = sizeChart[0].size;
    let highestScore = 0;

    for (const sizeInfo of sizeChart) {
        let score = 100;
        let diffs = 0;
        let count = 0;

        // Compare Chest (for tops, outerwear, dresses)
        if (['tops', 'outerwear', 'dresses'].includes(layer) && sizeInfo.chest) {
            const [min, max] = sizeInfo.chest;
            const target = profile.chest;
            if (target < min) {
                diffs += min - target;
            } else if (target > max) {
                diffs += target - max;
            }
            count++;
        }

        // Compare Waist (for all except shoes)
        if (['tops', 'bottoms', 'outerwear', 'dresses'].includes(layer) && sizeInfo.waist) {
            const [min, max] = sizeInfo.waist;
            const target = profile.waist;
            if (target < min) {
                diffs += min - target;
            } else if (target > max) {
                diffs += target - max;
            }
            count++;
        }

        // Compare Hips (for bottoms, dresses)
        if (['bottoms', 'dresses'].includes(layer) && sizeInfo.hips) {
            const [min, max] = sizeInfo.hips;
            const target = profile.hips;
            if (target < min) {
                diffs += min - target;
            } else if (target > max) {
                diffs += target - max;
            }
            count++;
        }

        // Compare Shoulder (for tops, outerwear)
        if (['tops', 'outerwear'].includes(layer) && sizeInfo.shoulder) {
            const target = profile.shoulder;
            // Shoulder is usually a single number in garments, let's treat it as max
            const max = sizeInfo.shoulder;
            const min = max - 4; // allow 4cm tolerance smaller
            if (target < min) {
                diffs += min - target;
            } else if (target > max) {
                diffs += (target - max) * 2; // tight shoulder hurts more
            }
            count++;
        }

        if (count > 0) {
            // Deduct 2 points for every cm of difference, max deduct 50
            const penalty = Math.min(50, diffs * 2);
            score -= penalty;
        }

        if (score > highestScore) {
            highestScore = score;
            bestSize = sizeInfo.size;
        }
    }

    // Ensure we don't go below realistic fit score if size chart exists but profile is wildly off
    highestScore = Math.max(30, highestScore);

    return { recommendedSize: bestSize, fitScore: Math.round(highestScore) };
}

export function generateMockSizeChart(layer: string): ProductSizeMeasurement[] {
    const isTop = ['tops', 'outerwear', 'dresses'].includes(layer);
    return [
        {
            size: 'S',
            chest: isTop ? [80, 84] : undefined,
            waist: [64, 68],
            hips: [86, 90],
            shoulder: isTop ? 36 : undefined,
        },
        {
            size: 'M',
            chest: isTop ? [84, 88] : undefined,
            waist: [68, 72],
            hips: [90, 94],
            shoulder: isTop ? 38 : undefined,
        },
        {
            size: 'L',
            chest: isTop ? [88, 92] : undefined,
            waist: [72, 76],
            hips: [94, 98],
            shoulder: isTop ? 40 : undefined,
        },
        {
            size: 'XL',
            chest: isTop ? [92, 96] : undefined,
            waist: [76, 80],
            hips: [98, 102],
            shoulder: isTop ? 42 : undefined,
        }
    ];
}
