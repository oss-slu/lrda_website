"use client";

import { useEffect, useRef, useState } from "react";

type RevealOptions = {
	rootMargin?: string;
	threshold?: number | number[];
};

export function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);
	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;
		const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
		const onChange = () => setReduced(mql.matches);
		setReduced(mql.matches);
		mql.addEventListener?.("change", onChange);
		return () => mql.removeEventListener?.("change", onChange);
	}, []);
	return reduced;
}

export function useReveal<T extends Element = HTMLElement>(options: RevealOptions = {}) {
	const { rootMargin = "80px 0px", threshold = 0.1 } = options;
	const elementRef = useRef<T | null>(null);
	const [isVisible, setIsVisible] = useState(false);
	const prefersReduced = usePrefersReducedMotion();

	useEffect(() => {
		if (prefersReduced) {
			setIsVisible(true);
			return;
		}

		const node = elementRef.current;
		if (!node) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (entry && entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ root: null, rootMargin, threshold }
		);

		observer.observe(node);
		return () => observer.disconnect();
	}, [prefersReduced, rootMargin, threshold]);

	return { ref: elementRef, isVisible, prefersReduced } as const;
}

export const motionVariants = {
	fadeIn: "opacity-0 will-change-transform data-[reveal=true]:opacity-100 transition-opacity duration-700 ease-out",
	fadeInUp:
		"opacity-0 translate-y-4 will-change-transform data-[reveal=true]:opacity-100 data-[reveal=true]:translate-y-0 transition-all duration-700 ease-out",
	scaleIn:
		"opacity-0 scale-[0.98] will-change-transform data-[reveal=true]:opacity-100 data-[reveal=true]:scale-100 transition-transform duration-500 ease-out",
} as const;


