import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const NOTES_PAGE_SIZE = 16;

type UseInfiniteNotesOptions<T> = {
  items: T[];
  pageSize?: number;
};

type UseInfiniteNotesReturn<T> = {
  visibleItems: T[];
  isLoading: boolean;
  hasMore: boolean;
  loadNext: () => void;
  loaderRef: (node: Element | null) => void;
  reset: () => void;
};

export function useInfiniteNotes<T>({ items, pageSize = NOTES_PAGE_SIZE }: UseInfiniteNotesOptions<T>): UseInfiniteNotesReturn<T> {
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<Element | null>(null);

  const hasMore = useMemo(() => visibleCount < items.length, [visibleCount, items.length]);

  // Reset pagination when source items change
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [items, pageSize]);

  const loadNext = useCallback(() => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    // Simulate async fetch; in this app we slice from in-memory filtered items
    // Keep a micro-delay to allow spinner to render without causing layout shift
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + pageSize, items.length));
      setIsLoading(false);
    }, 75);
  }, [isLoading, hasMore, pageSize, items.length]);

  const loaderRef = useCallback(
    (node: Element | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      sentinelRef.current = node;

      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            loadNext();
          }
        },
        { root: null, rootMargin: "200px 0px", threshold: 0 }
      );

      observerRef.current.observe(node);
    },
    [loadNext]
  );

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const reset = useCallback(() => {
    setVisibleCount(pageSize);
    setIsLoading(false);
  }, [pageSize]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  return { visibleItems, isLoading, hasMore, loadNext, loaderRef, reset };
}
