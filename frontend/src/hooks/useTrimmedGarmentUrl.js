import { useEffect, useRef, useState } from 'react';
import { trimImageToObjectURL } from '../utils/trimGarmentImage';

/**
 * Border-cropped display URL for garment previews (trim transparent / white margins).
 * Revokes blob URLs on change and unmount.
 * @param {string | null | undefined} src
 * @returns {string | undefined}
 */
export function useTrimmedGarmentUrl(src) {
    const [display, setDisplay] = useState(() => src || undefined);
    const createdRef = useRef(null);

    useEffect(() => {
        if (!src) {
            if (createdRef.current) {
                URL.revokeObjectURL(createdRef.current);
                createdRef.current = null;
            }
            setDisplay(undefined);
            return undefined;
        }

        setDisplay(src);

        let cancelled = false;

        if (createdRef.current) {
            URL.revokeObjectURL(createdRef.current);
            createdRef.current = null;
        }

        (async () => {
            try {
                const next = await trimImageToObjectURL(src);
                if (cancelled) {
                    if (typeof next === 'string' && next.startsWith('blob:')) {
                        URL.revokeObjectURL(next);
                    }
                    return;
                }
                if (next && next !== src && typeof next === 'string' && next.startsWith('blob:')) {
                    createdRef.current = next;
                    setDisplay(next);
                }
            } catch {
                /* keep original src */
            }
        })();

        return () => {
            cancelled = true;
            if (createdRef.current) {
                URL.revokeObjectURL(createdRef.current);
                createdRef.current = null;
            }
        };
    }, [src]);

    return display;
}
