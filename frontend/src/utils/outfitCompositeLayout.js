/**
 * Deterministic virtual body / outfit compositing (no AI).
 * Fixed coordinate system: shared waist line, width chain, overlap stitch.
 *
 * Reference frame: 300×600. All ratios scale with actual container size.
 */

export const OUTFIT_COMPOSITE = {
    refWidth: 300,
    refHeight: 600,
    /** Top band starts here (px at ref height). */
    topAnchorY: 80,
    /** Top garment slot width as fraction of container inner width. */
    topWidthRatio: 0.62,
    /** bottom_width = top_width * k */
    bottomWidthOfTop: 0.95,
    /** Default overlap (px at ref height); clamped to [5, 15] when scaled. */
    overlapRefPx: 10,
    /** If no top image, place bottom waist on this fraction of body height. */
    waistFallbackRatio: 0.42,
};

/**
 * @param {number} containerHeight
 * @returns {number} overlap in px for this container
 */
export function scaleOverlapPx(containerHeight) {
    const raw = OUTFIT_COMPOSITE.overlapRefPx * (containerHeight / OUTFIT_COMPOSITE.refHeight);
    return Math.round(Math.min(15, Math.max(5, raw)));
}

/**
 * @param {number} containerWidth
 * @param {number} containerHeight
 */
export function topSlotLayout(containerWidth, containerHeight) {
    const topWidth = containerWidth * OUTFIT_COMPOSITE.topWidthRatio;
    const topLeft = (containerWidth - topWidth) / 2;
    const topY = (containerHeight * OUTFIT_COMPOSITE.topAnchorY) / OUTFIT_COMPOSITE.refHeight;
    return { topWidth, topLeft, topY };
}

export function bottomWidthFromTop(topWidth) {
    return topWidth * OUTFIT_COMPOSITE.bottomWidthOfTop;
}

/**
 * Waist stitch: bottom slot starts here (px from container top).
 * @param {number} topY
 * @param {number} topRenderedHeight
 * @param {number} overlapPx
 */
export function bottomTopPx(topY, topRenderedHeight, overlapPx) {
    return topY + topRenderedHeight - overlapPx;
}
