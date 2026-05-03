import { useMemo } from 'react';
import { useOutfitCompositeLayout } from '../../hooks/useOutfitCompositeLayout';
import { useTrimmedGarmentUrl } from '../../hooks/useTrimmedGarmentUrl';

/**
 * Deterministic stacked outfit preview (top + bottom only): shared body grid, width chain, overlap stitch.
 * Images are border-cropped client-side (white / transparent margins).
 */
export function OutfitCompositeStack({
    topUrl,
    bottomUrl,
    topCutoutClass = '',
    bottomCutoutClass = '',
    titleTop = '',
    titleBottom = '',
}) {
    const topSrc = useTrimmedGarmentUrl(topUrl);
    const bottomSrc = useTrimmedGarmentUrl(bottomUrl);

    const {
        containerRef,
        topImgRef,
        bottomImgRef,
        topSlotStyle,
        bottomSlotStyle,
        baseImgStyle,
        onTopLoad,
        onBottomLoad,
    } = useOutfitCompositeLayout({
        sourceTopUrl: topUrl,
        sourceBottomUrl: bottomUrl,
        displayTopUrl: topSrc,
        displayBottomUrl: bottomSrc,
    });

    const topImgStyle = useMemo(
        () => ({ ...baseImgStyle, objectPosition: 'center bottom' }),
        [baseImgStyle]
    );
    const bottomImgStyle = useMemo(
        () => ({ ...baseImgStyle, objectPosition: 'center top' }),
        [baseImgStyle]
    );

    return (
        <div ref={containerRef} className="outfit-composite">
            {topSrc ? (
                <div
                    className="outfit-composite__slot outfit-composite__slot--top"
                    style={topSlotStyle}
                >
                    <img
                        ref={topImgRef}
                        src={topSrc}
                        alt=""
                        title={titleTop || undefined}
                        className={`outfit-composite__img layer-img ${topCutoutClass}`.trim()}
                        style={topImgStyle}
                        onLoad={onTopLoad}
                        draggable={false}
                    />
                </div>
            ) : null}

            {bottomSrc && bottomSlotStyle ? (
                <div
                    className="outfit-composite__slot outfit-composite__slot--bottom"
                    style={bottomSlotStyle}
                >
                    <img
                        ref={bottomImgRef}
                        src={bottomSrc}
                        alt=""
                        title={titleBottom || undefined}
                        className={`outfit-composite__img layer-img ${bottomCutoutClass}`.trim()}
                        style={bottomImgStyle}
                        onLoad={onBottomLoad}
                        draggable={false}
                    />
                </div>
            ) : null}
        </div>
    );
}
