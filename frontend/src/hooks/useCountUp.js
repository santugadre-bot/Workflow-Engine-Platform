import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Animated counter hook — counts from 0 to `end` when the
 * returned ref enters the viewport.
 *
 * @param {number}  end       Target number (e.g. 99.2)
 * @param {string}  suffix    Appended after the number (e.g. '%', 'd')
 * @param {number}  duration  Animation duration in ms (default 2000)
 * @param {number}  decimals  Decimal places to show (default 0)
 * @returns {{ ref, display }}
 */
export default function useCountUp(end, suffix = '', duration = 2000, decimals = 0) {
    const [display, setDisplay] = useState(`0${suffix}`);
    const ref = useRef(null);
    const hasAnimated = useRef(false);

    const animate = useCallback(() => {
        const start = performance.now();

        const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // EaseOutExpo curve for a premium feel
            const eased = 1 - Math.pow(1 - progress, 4);
            const current = eased * end;

            setDisplay(`${current.toFixed(decimals)}${suffix}`);

            if (progress < 1) {
                requestAnimationFrame(tick);
            }
        };

        requestAnimationFrame(tick);
    }, [end, suffix, duration, decimals]);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    animate();
                }
            },
            { threshold: 0.3 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [animate]);

    return { ref, display };
}
