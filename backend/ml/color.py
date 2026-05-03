import cv2
import numpy as np
import os

COLOR_MAP = [
    ("black", (0, 0, 0)),
    ("white", (255, 255, 255)),
    ("gray", (128, 128, 128)),
    ("red", (220, 20, 60)),
    ("dark_red", (139, 0, 0)),
    ("pink", (255, 105, 180)),
    ("orange", (255, 140, 0)),
    ("yellow", (255, 215, 0)),
    ("green", (34, 139, 34)),
    ("lime", (50, 205, 50)),
    ("blue", (30, 144, 255)),
    ("navy", (0, 0, 128)),
    ("sky_blue", (135, 206, 235)),
    ("purple", (128, 0, 128)),
    ("violet", (148, 0, 211)),
    ("brown", (139, 69, 19)),
    ("beige", (245, 245, 220)),
    ("tan", (210, 180, 140)),
    ("olive", (128, 128, 0)),
    ("maroon", (128, 0, 0)),
]

PALETTE_BY_NAME = {name: rgb for name, rgb in COLOR_MAP}

def _clamp_bbox(bbox, width, height):
    x1, y1, x2, y2 = bbox
    x1 = max(0, min(int(x1), width - 1))
    y1 = max(0, min(int(y1), height - 1))
    x2 = max(0, min(int(x2), width))
    y2 = max(0, min(int(y2), height))
    if x2 <= x1 or y2 <= y1:
        return None
    return (x1, y1, x2, y2)

def _closest_color(rgb):
    r, g, b = [int(c) for c in rgb]
    min_dist = float("inf")
    best = "gray"
    for name, (cr, cg, cb) in COLOR_MAP:
        dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
        if dist < min_dist:
            min_dist = dist
            best = name
    return best

def _center_crop(image_bgr, crop_ratio=0.6):
    h, w = image_bgr.shape[:2]
    if h < 4 or w < 4:
        return image_bgr
    y1 = int(h * ((1 - crop_ratio) / 2))
    y2 = int(h * (1 - (1 - crop_ratio) / 2))
    x1 = int(w * ((1 - crop_ratio) / 2))
    x2 = int(w * (1 - (1 - crop_ratio) / 2))
    cropped = image_bgr[y1:y2, x1:x2]
    return cropped if cropped.size > 0 else image_bgr

def _save_debug(debug_dir, debug_prefix, crop_bgr, swatch_bgr):
    os.makedirs(debug_dir, exist_ok=True)
    crop_path = os.path.join(debug_dir, f"{debug_prefix}_crop.jpg")
    swatch_path = os.path.join(debug_dir, f"{debug_prefix}_swatch.jpg")
    cv2.imwrite(crop_path, crop_bgr)
    cv2.imwrite(swatch_path, swatch_bgr)
    return crop_path, swatch_path

def extract_color(image, bbox, save_debug=False, debug_dir=None, debug_prefix="det"):
    h_img, w_img = image.shape[:2]
    clamped = _clamp_bbox(bbox, w_img, h_img)
    if clamped is None:
        return {"color": "gray", "label": "gray"}
    x1, y1, x2, y2 = clamped

    crop = image[y1:y2, x1:x2]
    crop = _center_crop(crop, crop_ratio=0.6)

    if crop.size == 0:
        return {"color": "gray", "label": "gray"}

    rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
    pixels = rgb.reshape(-1, 3).astype(np.float32)
    if len(pixels) == 0:
        return {"color": "gray", "label": "gray"}

    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    hsv_pixels = hsv.reshape(-1, 3).astype(np.float32)
    s = hsv_pixels[:, 1]
    v = hsv_pixels[:, 2]
    mean_rgb = np.mean(pixels, axis=1)

    # Neutral dominance gate to keep dark/light garments stable.
    black_ratio = float(np.mean(mean_rgb < 55))
    white_ratio = float(np.mean((mean_rgb > 220) & (s < 28)))
    gray_ratio = float(np.mean((s < 28) & (mean_rgb >= 55) & (mean_rgb <= 220)))
    if black_ratio >= 0.40:
        color = "black"
        top_colors = [{"color": "black", "ratio": round(black_ratio, 4)}]
        result = {"color": color, "label": color, "top_colors": top_colors}
        if save_debug and debug_dir:
            swatch = np.full((80, 80, 3), (0, 0, 0), dtype=np.uint8)
            crop_path, swatch_path = _save_debug(debug_dir, debug_prefix, crop, swatch)
            result["debug_crop"] = crop_path
            result["debug_swatch"] = swatch_path
        return result
    if white_ratio >= 0.55:
        color = "white"
        top_colors = [{"color": "white", "ratio": round(white_ratio, 4)}]
        result = {"color": color, "label": color, "top_colors": top_colors}
        if save_debug and debug_dir:
            swatch = np.full((80, 80, 3), (255, 255, 255), dtype=np.uint8)
            crop_path, swatch_path = _save_debug(debug_dir, debug_prefix, crop, swatch)
            result["debug_crop"] = crop_path
            result["debug_swatch"] = swatch_path
        return result
    if gray_ratio >= 0.50:
        color = "gray"
        top_colors = [{"color": "gray", "ratio": round(gray_ratio, 4)}]
        result = {"color": color, "label": color, "top_colors": top_colors}
        if save_debug and debug_dir:
            swatch = np.full((80, 80, 3), (128, 128, 128), dtype=np.uint8)
            crop_path, swatch_path = _save_debug(debug_dir, debug_prefix, crop, swatch)
            result["debug_crop"] = crop_path
            result["debug_swatch"] = swatch_path
        return result

    # Remove dark shadows, bright highlights, and low-saturation noise.
    mask = (mean_rgb > 30) & (mean_rgb < 240) & (s >= 30) & (v >= 45) & (v <= 240)
    filtered = pixels[mask]
    if len(filtered) < 50:
        filtered = pixels

    k = 3 if len(filtered) < 3000 else 5
    k = min(k, len(filtered))
    if k <= 0:
        return {"color": "gray", "label": "gray"}

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 25, 0.5)
    _, labels, centers = cv2.kmeans(
        filtered.astype(np.float32),
        k,
        None,
        criteria,
        5,
        cv2.KMEANS_PP_CENTERS
    )
    counts = np.bincount(labels.flatten(), minlength=k).astype(np.float32)
    total = max(float(np.sum(counts)), 1.0)
    coverages = counts / total

    ranked = sorted(
        [(int(i), float(coverages[i])) for i in range(k)],
        key=lambda x: x[1],
        reverse=True
    )

    # Ignore tiny clusters (<5%) so print/logo colors do not dominate.
    significant = [(idx, cov) for idx, cov in ranked if cov >= 0.05]
    if not significant:
        significant = ranked[:1]

    top_colors = []
    for idx, cov in significant[:2]:
        center_rgb = centers[idx]
        color_name = _closest_color(center_rgb)
        top_colors.append({
            "color": color_name,
            "ratio": round(cov, 4)
        })

    color = top_colors[0]["color"] if top_colors else "gray"
    result = {"color": color, "label": color, "top_colors": top_colors}

    if save_debug and debug_dir:
        swatch = np.full((80, 80, 3), 0, dtype=np.uint8)
        rgb_value = PALETTE_BY_NAME.get(color, (128, 128, 128))
        swatch[:, :] = (rgb_value[2], rgb_value[1], rgb_value[0])  # BGR
        swatch_bgr = swatch
        crop_path, swatch_path = _save_debug(debug_dir, debug_prefix, crop, swatch_bgr)
        result["debug_crop"] = crop_path
        result["debug_swatch"] = swatch_path

    return result
