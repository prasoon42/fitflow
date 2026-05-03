import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../config';

/** @type {Map<string, { url: string, backgroundRemoved: boolean, reason?: string }>} */
const urlCache = new Map();

function normalizeCached(entry) {
    if (!entry) return null;
    if (typeof entry === 'string') {
        return { url: entry, backgroundRemoved: true };
    }
    return entry;
}

function buildRawDisplay(layers) {
    const next = { top: null, bottom: null };
    for (const slot of ['top', 'bottom']) {
        if (layers[slot]?.image) next[slot] = layers[slot].image;
    }
    return next;
}

function emptyMeta() {
    return { top: null, bottom: null };
}

/**
 * Resolves display URLs for outfit layers; uses backend remove.bg proxy when enabled.
 * Backend skips the API if the image already has transparency, verifies alpha on results,
 * and uses crop=false to avoid over-tight cropping.
 */
export function useClothingTransparentUrls(layers, token) {
    const [display, setDisplay] = useState(() => buildRawDisplay(layers));
    const [processing, setProcessing] = useState(false);
    const [removalEnabled, setRemovalEnabled] = useState(null);
    const [cutoutMeta, setCutoutMeta] = useState(emptyMeta);
    const abortRef = useRef(null);

    useEffect(() => {
        const raw = buildRawDisplay(layers);
        setDisplay(raw);
        setCutoutMeta(emptyMeta());

        if (!token) {
            setRemovalEnabled(false);
            return;
        }

        let cancelled = false;

        const run = async () => {
            abortRef.current?.abort();
            abortRef.current = new AbortController();
            const { signal } = abortRef.current;

            try {
                const st = await fetch(`${API_BASE}/clothing/background-removal`, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal,
                });
                if (cancelled) return;
                const j = await st.json().catch(() => ({}));
                const enabled = Boolean(j.enabled);
                setRemovalEnabled(enabled);

                if (!enabled) return;

                setProcessing(true);
                const next = { ...raw };
                const meta = emptyMeta();

                for (const slot of ['top', 'bottom']) {
                    const src = raw[slot];
                    if (!src) continue;

                    if (urlCache.has(src)) {
                        const cached = normalizeCached(urlCache.get(src));
                        next[slot] = cached.url;
                        meta[slot] = {
                            backgroundRemoved: cached.backgroundRemoved,
                            reason: cached.reason,
                        };
                        continue;
                    }

                    try {
                        const res = await fetch(`${API_BASE}/clothing/transparent`, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ image_url: src }),
                            signal,
                        });
                        if (res.ok) {
                            const data = await res.json();
                            if (data.url) {
                                const backgroundRemoved = data.background_removed !== false;
                                urlCache.set(src, {
                                    url: data.url,
                                    backgroundRemoved,
                                    reason: data.reason,
                                });
                                next[slot] = data.url;
                                meta[slot] = {
                                    backgroundRemoved,
                                    reason: data.reason,
                                };
                                continue;
                            }
                        }
                    } catch {
                        /* keep original */
                    }
                    meta[slot] = { backgroundRemoved: false, reason: 'request_failed' };
                    next[slot] = src;
                }

                if (!cancelled) {
                    setDisplay(next);
                    setCutoutMeta(meta);
                }
            } finally {
                if (!cancelled) setProcessing(false);
            }
        };

        run();
        return () => {
            cancelled = true;
            abortRef.current?.abort();
        };
    }, [layers.top?.image, layers.bottom?.image, token]);

    return { display, processing, removalEnabled, cutoutMeta };
}
