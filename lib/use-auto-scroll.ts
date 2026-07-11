import { useEffect, useRef, useState } from "react";

// Distance (px) from the bottom that still counts as "at the bottom" —
// keeps auto-follow on through minor rounding/sub-pixel scroll jitter.
const BOTTOM_THRESHOLD = 48;

/**
 * Auto-scrolls a container to the bottom as new content streams in, but
 * only while the user is already at (or near) the bottom. If they scroll
 * up to re-read something, auto-follow pauses until they scroll back down
 * or call `scrollToBottom`.
 */
export function useAutoScroll<T extends HTMLElement>(deps: unknown[]) {
  const containerRef = useRef<T | null>(null);
  const atBottomRef = useRef(true);
  const [atBottom, setAtBottom] = useState(true);

  function isNearBottom(el: T) {
    return el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_THRESHOLD;
  }

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const near = isNearBottom(el);
    atBottomRef.current = near;
    setAtBottom(near);
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    atBottomRef.current = true;
    setAtBottom(true);
  }

  useEffect(() => {
    // Instant, not smooth: deltas can arrive many times a second while
    // someone is talking, and each smooth-scroll call would restart the
    // animation toward a growing target — the view perpetually lags behind
    // instead of tracking the bottom.
    if (atBottomRef.current) {
      containerRef.current?.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "auto",
      });
    }
    // Only re-run when the streamed content changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { containerRef, atBottom, handleScroll, scrollToBottom };
}
