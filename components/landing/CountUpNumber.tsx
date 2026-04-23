'use client';

import { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
    value: number;
    decimals?: number;
    duration?: number;
    className?: string;
    prefix?: string;
    suffix?: string;
}

export function CountUpNumber({
    value,
    decimals = 0,
    duration = 2000,
    className,
    prefix = '',
    suffix = '',
}: CountUpNumberProps) {
    const [display, setDisplay] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node || hasAnimated) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !hasAnimated) {
                        setHasAnimated(true);
                        const startTime = performance.now();
                        const startValue = 0;
                        const endValue = value;

                        const animate = (now: number) => {
                            const elapsed = now - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            // easeOutExpo
                            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
                            const current = startValue + (endValue - startValue) * eased;
                            setDisplay(current);
                            if (progress < 1) {
                                requestAnimationFrame(animate);
                            } else {
                                setDisplay(endValue);
                            }
                        };
                        requestAnimationFrame(animate);
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.3 }
        );

        observer.observe(node);
        return () => observer.disconnect();
    }, [value, duration, hasAnimated]);

    const formatted = display.toLocaleString('es-MX', {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
    });

    return (
        <span ref={ref} className={className}>
            {prefix}
            {formatted}
            {suffix}
        </span>
    );
}
