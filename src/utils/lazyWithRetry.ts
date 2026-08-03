import React from 'react';

const RELOAD_FLAG = 'juno_chunk_reloaded_at';
const RELOAD_COOLDOWN_MS = 30_000;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * React.lazy that survives a failed chunk download.
 *
 * Route chunks are fetched on navigation, so a dropped mobile connection — or a
 * hashed filename that no longer exists after a deploy — leaves the import
 * promise rejected. A plain React.lazy has no recovery from that: Suspense keeps
 * showing the fallback and the route never mounts, which reads to the customer
 * as a frozen page until they reload by hand.
 *
 * Retry twice with a short backoff, then reload once to pick up the new build.
 * The reload is rate-limited through sessionStorage so a genuinely broken chunk
 * cannot put the tab in a refresh loop.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- must accept components with any prop shape
export function lazyWithRetry<T extends React.ComponentType<any>>(
    importer: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
    return React.lazy(async () => {
        for (let attempt = 0; attempt < 3; attempt += 1) {
            try {
                return await importer();
            } catch (error) {
                if (attempt < 2) {
                    await wait(400 * (attempt + 1));
                    continue;
                }

                const lastReload = Number(sessionStorage.getItem(RELOAD_FLAG) || 0);
                if (!Number.isFinite(lastReload) || Date.now() - lastReload > RELOAD_COOLDOWN_MS) {
                    sessionStorage.setItem(RELOAD_FLAG, String(Date.now()));
                    window.location.reload();
                    // Resolve with a placeholder; the reload replaces this document.
                    return { default: (() => null) as unknown as T };
                }
                throw error;
            }
        }
        throw new Error('unreachable');
    });
}
