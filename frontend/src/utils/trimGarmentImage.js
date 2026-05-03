/**
 * Crop garment photos to visible pixels (transparent edges + near-white JPEG margins).
 * Pure canvas math — no ML.
 */

const ALPHA_BG_MAX = 14;
const WHITE_RGB_MIN = 248;

/**
 * @param {number} r
 * @param {number} g
 * @param {number} b
 * @param {number} a
 */
function isBackgroundPixel(r, g, b, a) {
    if (a <= ALPHA_BG_MAX) return true;
    if (r >= WHITE_RGB_MIN && g >= WHITE_RGB_MIN && b >= WHITE_RGB_MIN) return true;
    return false;
}

/**
 * Bounding box of non-background pixels.
 * @param {ImageData} imageData
 */
export function getTrimBoundingBox(imageData) {
    const { width, height, data } = imageData;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (!isBackgroundPixel(r, g, b, a)) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }

    if (maxX < minX || maxY < minY) return null;

    const pad = 1;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);

    return {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
    };
}

/**
 * Loads image, trims borders, returns object URL of PNG (or original src string on failure).
 * @param {string} src
 * @returns {Promise<string>}
 */
export async function trimImageToObjectURL(src) {
    if (!src || typeof src !== 'string') return src;

    const img = new Image();
    img.crossOrigin = 'anonymous';

    await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('image load failed'));
        img.src = src;
    });

    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (w < 2 || h < 2) return src;

    const maxScan = 1600;
    let sw = w;
    let sh = h;
    let scale = 1;
    if (w > maxScan || h > maxScan) {
        scale = maxScan / Math.max(w, h);
        sw = Math.round(w * scale);
        sh = Math.round(h * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return src;

    try {
        ctx.drawImage(img, 0, 0, sw, sh);
        const imageData = ctx.getImageData(0, 0, sw, sh);
        const boxS = getTrimBoundingBox(imageData);
        if (!boxS || boxS.width < 2 || boxS.height < 2) return src;

        const ox0 = Math.floor(boxS.x / scale);
        const oy0 = Math.floor(boxS.y / scale);
        const ow0 = Math.ceil(boxS.width / scale);
        const oh0 = Math.ceil(boxS.height / scale);

        let ox = ox0;
        let oy = oy0;
        let ow = ow0;
        let oh = oh0;
        ox = Math.max(0, Math.min(ox, w - 1));
        oy = Math.max(0, Math.min(oy, h - 1));
        ow = Math.max(2, Math.min(ow, w - ox));
        oh = Math.max(2, Math.min(oh, h - oy));

        const out = document.createElement('canvas');
        out.width = ow;
        out.height = oh;
        const octx = out.getContext('2d');
        if (!octx) return src;
        octx.drawImage(img, ox, oy, ow, oh, 0, 0, ow, oh);

        return new Promise((resolve) => {
            out.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(src);
                        return;
                    }
                    resolve(URL.createObjectURL(blob));
                },
                'image/png',
                1
            );
        });
    } catch {
        return src;
    }
}
