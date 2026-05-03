/** Stable localStorage keys for profile JSON (gender, styles, colors, age). */
export function normalizeEmailKey(email) {
    const e = String(email || '').trim().toLowerCase();
    return e || 'guest';
}

export function profileStorageKey(email) {
    return `fitflow-profile-${normalizeEmailKey(email)}`;
}

/**
 * Load parsed profile object from localStorage; migrates legacy keys (non-normalized email).
 * @returns {object|null}
 */
export function loadProfileFromStorage(email) {
    if (!email) return null;
    const key = profileStorageKey(email);
    try {
        let raw = localStorage.getItem(key);
        if (!raw) {
            const legacyKey = `fitflow-profile-${String(email).trim()}`;
            if (legacyKey !== key) {
                raw = localStorage.getItem(legacyKey);
                if (raw) {
                    localStorage.setItem(key, raw);
                    localStorage.removeItem(legacyKey);
                }
            }
        }
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return typeof parsed === 'object' && parsed !== null ? parsed : null;
    } catch {
        return null;
    }
}
