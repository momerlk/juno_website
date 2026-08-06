/**
 * Run a state update once the shopper has stopped moving.
 *
 * Deferred sections (reviews, related items, sizing) finish loading while the
 * page is being flung past them, and a React commit landing inside a gesture is
 * exactly what a dropped frame is. Idle time alone is not enough: a fling has
 * gaps between its scroll events that idle callbacks happily fill. So wait for
 * the scroll to go quiet first, then take an idle slot, with a hard timeout so
 * content can never be held hostage by a shopper who keeps scrolling.
 */
const SCROLL_QUIET_MS = 140;
const DEFAULT_TIMEOUT_MS = 1500;

let lastScrollAt = 0;

if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => { lastScrollAt = performance.now(); }, { passive: true, capture: true });
}

const onIdle = (task: () => void, timeout: number) => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(() => task(), { timeout });
    else window.setTimeout(task, 0);
};

export const runWhenIdle = (task: () => void, timeout: number = DEFAULT_TIMEOUT_MS): void => {
    if (typeof window === 'undefined') {
        task();
        return;
    }
    const startedAt = performance.now();
    const attempt = () => {
        const sinceScroll = performance.now() - lastScrollAt;
        if (sinceScroll < SCROLL_QUIET_MS && performance.now() - startedAt < timeout) {
            window.setTimeout(attempt, SCROLL_QUIET_MS - sinceScroll);
            return;
        }
        onIdle(task, Math.max(0, timeout - (performance.now() - startedAt)));
    };
    attempt();
};
