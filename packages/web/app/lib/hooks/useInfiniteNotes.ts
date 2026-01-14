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
  const prevItemsLengthRef = useRef<number>(0);

  const hasMore = useMemo(() => visibleCount < items.length, [visibleCount, items.length]);

  // Reset pagination only when items are replaced (length decreases or stays same but different items)
  // Don't reset when items are appended (length increases)
  useEffect(() => {
    const prevLength = prevItemsLengthRef.current;
    const currentLength = items.length;

    // If length decreased or stayed same, it's a replacement - reset
    // If length increased, it's an append - don't reset, just update visible count if needed
    if (currentLength < prevLength || (currentLength === prevLength && prevLength > 0)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset when items replaced
      setVisibleCount(pageSize);
    } else if (currentLength > prevLength && prevLength > 0) {
      // Items were appended, don't reset but ensure visibleCount doesn't exceed items.length
      setVisibleCount((prev) => Math.min(prev, items.length));
    } else if (prevLength === 0 && currentLength > 0) {
      // Initial load
      setVisibleCount(pageSize);
    }

    prevItemsLengthRef.current = currentLength;
  }, [items.length, pageSize]);

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
