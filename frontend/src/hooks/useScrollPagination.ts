import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface UseScrollPaginationOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  hasMore: boolean;
  isFetching: boolean;
  onLoadMore: () => Promise<void>;
  /** Pixel threshold from top to trigger load (default: 100) */
  threshold?: number;
  /** Pixel threshold from bottom to consider "at bottom" (default: 150) */
  bottomThreshold?: number;
  /** Total item count — used to detect changes */
  itemCount: number;
}

export function useScrollPagination({
  containerRef,
  hasMore,
  isFetching,
  onLoadMore,
  threshold = 100,
  bottomThreshold = 150,
  itemCount,
}: UseScrollPaginationOptions) {
  const prevScrollHeightRef = useRef(0);
  const isFetchingOlderRef = useRef(false);
  const prevItemCountRef = useRef(itemCount);

  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < bottomThreshold;
  }, [containerRef, bottomThreshold]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (el.scrollTop < threshold && hasMore && !isFetching) {
      // Snapshot scrollHeight before fetch
      prevScrollHeightRef.current = el.scrollHeight;
      isFetchingOlderRef.current = true;
      onLoadMore();
    }
  }, [containerRef, hasMore, isFetching, onLoadMore, threshold]);

  // Scroll preservation: runs synchronously before browser paint
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const didItemCountGrow = itemCount > prevItemCountRef.current;
    const wasLoadingOlder = isFetchingOlderRef.current;

    if (didItemCountGrow && wasLoadingOlder && prevScrollHeightRef.current > 0) {
      // Older messages were prepended → preserve viewport position
      const delta = el.scrollHeight - prevScrollHeightRef.current;
      if (delta > 0) {
        el.scrollTop += delta;
      }
      isFetchingOlderRef.current = false;
      prevScrollHeightRef.current = 0;
    } else if (didItemCountGrow && !wasLoadingOlder) {
      // New message arrived at the bottom
      if (isNearBottom()) {
        el.scrollTop = el.scrollHeight;
      }
    }

    prevItemCountRef.current = itemCount;
  }, [itemCount, containerRef, isNearBottom]);

  // Attach scroll listener
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [containerRef, handleScroll]);

  // Scroll to bottom on initial mount
  const scrollToBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [containerRef]);

  return { scrollToBottom, isNearBottom };
}
