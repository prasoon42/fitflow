import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
    OUTFIT_COMPOSITE,
    bottomTopPx,
    bottomWidthFromTop,
    scaleOverlapPx,
    topSlotLayout,
} from '../utils/outfitCompositeLayout';

/**
 * Measures container + loaded images; returns deterministic absolute styles (px).
 * Top + bottom only (no footwear).
 *
 * `sourceTopUrl` / `sourceBottomUrl` = stable wardrobe URLs (reset layout when these change).
 * `displayTopUrl` / `displayBottomUrl` = actual img src (may switch to trimmed blob without resetting).
 */
export function useOutfitCompositeLayout({
    sourceTopUrl,
    sourceBottomUrl,
    displayTopUrl,
    displayBottomUrl,
}) {
    const containerRef = useRef(null);
    const topImgRef = useRef(null);
    const bottomImgRef = useRef(null);

    const [box, setBox] = useState({ w: OUTFIT_COMPOSITE.refWidth, h: OUTFIT_COMPOSITE.refHeight });
    const [topH, setTopH] = useState(0);
    const [bottomH, setBottomH] = useState(0);

    const remeasure = useCallback(() => {
        const c = containerRef.current;
        if (c) {
            const w = c.clientWidth;
            const h = c.clientHeight;
            if (w > 0 && h > 0) setBox({ w, h });
        }
        if (topImgRef.current) setTopH(topImgRef.current.offsetHeight);
        if (bottomImgRef.current) setBottomH(bottomImgRef.current.offsetHeight);
    }, []);

    useEffect(() => {
        const c = containerRef.current;
        if (!c || typeof ResizeObserver === 'undefined') return undefined;
        const ro = new ResizeObserver(() => remeasure());
        ro.observe(c);
        remeasure();
        return () => ro.disconnect();
    }, [remeasure]);

    /** Only reset when the user’s garment selection changes — not when trim swaps blob URLs. */
    useEffect(() => {
        setTopH(0);
        setBottomH(0);
    }, [sourceTopUrl, sourceBottomUrl]);

    /**
     * After src changes (e.g. trim → blob), remeasure immediately.
     * Cached images often skip `onLoad`; `complete` handles that.
     */
    useLayoutEffect(() => {
        requestAnimationFrame(() => {
            const topEl = topImgRef.current;
            const botEl = bottomImgRef.current;
            if (topEl?.complete && topEl.naturalWidth > 0) {
                setTopH(topEl.offsetHeight);
            }
            if (botEl?.complete && botEl.naturalWidth > 0) {
                setBottomH(botEl.offsetHeight);
            }
        });
    }, [displayTopUrl, displayBottomUrl]);

    const onTopLoad = useCallback(() => {
        requestAnimationFrame(() => {
            if (topImgRef.current) setTopH(topImgRef.current.offsetHeight);
        });
    }, []);

    const onBottomLoad = useCallback(() => {
        requestAnimationFrame(() => {
            if (bottomImgRef.current) setBottomH(bottomImgRef.current.offsetHeight);
        });
    }, []);

    const layout = useMemo(() => {
        const { w, h } = box;
        const overlap = scaleOverlapPx(h);
        const { topWidth, topLeft, topY } = topSlotLayout(w, h);
        const bottomW = bottomWidthFromTop(topWidth);
        const bottomLeft = (w - bottomW) / 2;

        let bottomTop = null;
        if (sourceBottomUrl) {
            if (sourceTopUrl) {
                if (topH > 0) {
                    bottomTop = bottomTopPx(topY, topH, overlap);
                }
            } else {
                bottomTop = h * OUTFIT_COMPOSITE.waistFallbackRatio;
            }
        }

        return {
            overlap,
            topWidth,
            topLeft,
            topY,
            bottomWidth: bottomW,
            bottomLeft,
            bottomTop,
            topH,
            bottomH,
        };
    }, [box, sourceTopUrl, sourceBottomUrl, topH, bottomH]);

    const topSlotStyle = useMemo(
        () => ({
            position: 'absolute',
            left: layout.topLeft,
            top: layout.topY,
            width: layout.topWidth,
            zIndex: 3,
        }),
        [layout.topLeft, layout.topY, layout.topWidth]
    );

    const bottomSlotStyle = useMemo(() => {
        if (!sourceBottomUrl || layout.bottomTop == null) return null;
        return {
            position: 'absolute',
            left: layout.bottomLeft,
            top: layout.bottomTop,
            width: layout.bottomWidth,
            zIndex: 2,
        };
    }, [sourceBottomUrl, layout.bottomTop, layout.bottomLeft, layout.bottomWidth]);

    const baseImgStyle = useMemo(
        () => ({
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
            display: 'block',
        }),
        []
    );

    return {
        containerRef,
        topImgRef,
        bottomImgRef,
        layout,
        topSlotStyle,
        bottomSlotStyle,
        baseImgStyle,
        onTopLoad,
        onBottomLoad,
    };
}
