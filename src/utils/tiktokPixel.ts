const DEFAULT_CURRENCY = 'PKR';

declare global {
    interface Window {
        ttq?: {
            track: (event: string, payload?: Record<string, unknown>) => void;
            identify: (payload: Record<string, string>) => void;
            page: () => void;
        };
    }
}

export interface TikTokContent {
    content_id: string;
    content_type: 'product' | 'product_group';
    content_name: string;
    price: number;
    num_items: number;
    brand: string;
}

export interface TikTokTrackPayload {
    contents?: TikTokContent[];
    value?: number;
    currency?: string;
    search_string?: string;
}

export interface TikTokCartLineLike {
    product_id: string;
    quantity: number;
    price: number;
    product_title?: string;
    seller_name?: string;
}

const normalizePrice = (value: unknown): number => {
    const numeric = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numeric) ? Math.max(0, numeric) : 0;
};

const normalizeQuantity = (value: unknown): number => {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numeric)) return 1;
    return Math.max(1, Math.floor(numeric));
};

const readTtq = () => {
    if (typeof window === 'undefined') return null;
    return window.ttq ?? null;
};

export const isTikTokReady = (): boolean => Boolean(readTtq());

export const trackTikTokEvent = (event: string, payload?: TikTokTrackPayload): void => {
    const ttq = readTtq();
    if (!ttq) return;

    try {
        if (payload) {
            ttq.track(event, payload);
            return;
        }
        ttq.track(event);
    } catch {
        // Ignore tracker errors to avoid disrupting checkout or browsing flows.
    }
};

export const buildTikTokContentsFromLines = (lines: TikTokCartLineLike[]): TikTokContent[] => {
    return lines
        .filter((line) => typeof line?.product_id === 'string' && line.product_id.trim().length > 0)
        .map((line) => {
            const quantity = normalizeQuantity(line.quantity);
            return {
                content_id: line.product_id,
                content_type: 'product',
                content_name: line.product_title || 'Product',
                price: normalizePrice(line.price),
                num_items: quantity,
                brand: line.seller_name || 'Juno',
            };
        });
};

export const getTikTokValueFromLines = (lines: TikTokCartLineLike[]): number => {
    return lines.reduce((sum, line) => {
        const price = normalizePrice(line.price);
        const qty = normalizeQuantity(line.quantity);
        return sum + price * qty;
    }, 0);
};

const toHex = (bytes: Uint8Array): string =>
    Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');

const sha256 = async (raw: string): Promise<string> => {
    const input = raw.trim().toLowerCase();
    if (!input) return '';

    if (typeof window !== 'undefined' && window.crypto?.subtle) {
        const data = new TextEncoder().encode(input);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        return toHex(new Uint8Array(digest));
    }

    return '';
};

export interface TikTokIdentifyInput {
    email?: string;
    phoneNumber?: string;
    externalId?: string;
}

export const identifyTikTokUser = async ({ email, phoneNumber, externalId }: TikTokIdentifyInput): Promise<void> => {
    const ttq = readTtq();
    if (!ttq) return;

    try {
        const [hashedEmail, hashedPhone, hashedExternalId] = await Promise.all([
            sha256(email || ''),
            sha256((phoneNumber || '').replace(/\s+/g, '')),
            sha256(externalId || ''),
        ]);

        const payload: Record<string, string> = {};
        if (hashedEmail) payload.email = hashedEmail;
        if (hashedPhone) payload.phone_number = hashedPhone;
        if (hashedExternalId) payload.external_id = hashedExternalId;

        if (Object.keys(payload).length === 0) return;
        ttq.identify(payload);
    } catch {
        // Ignore identify errors to avoid affecting conversion flow.
    }
};

export const trackTikTokSearch = (query: string): void => {
    const trimmed = query.trim();
    if (!trimmed) return;

    trackTikTokEvent('Search', {
        contents: [],
        value: 0,
        currency: DEFAULT_CURRENCY,
        search_string: trimmed,
    });
};

export const trackTikTokViewContent = (content: TikTokContent): void => {
    trackTikTokEvent('ViewContent', {
        contents: [content],
        value: content.price * content.num_items,
        currency: DEFAULT_CURRENCY,
    });
};

export const trackTikTokAddToCart = (lines: TikTokCartLineLike[]): void => {
    const contents = buildTikTokContentsFromLines(lines);
    if (contents.length === 0) return;

    trackTikTokEvent('AddToCart', {
        contents,
        value: getTikTokValueFromLines(lines),
        currency: DEFAULT_CURRENCY,
    });
};

export const trackTikTokInitiateCheckout = (lines: TikTokCartLineLike[]): void => {
    const contents = buildTikTokContentsFromLines(lines);
    if (contents.length === 0) return;

    trackTikTokEvent('InitiateCheckout', {
        contents,
        value: getTikTokValueFromLines(lines),
        currency: DEFAULT_CURRENCY,
    });
};

export const trackTikTokAddPaymentInfo = (lines: TikTokCartLineLike[]): void => {
    const contents = buildTikTokContentsFromLines(lines);
    if (contents.length === 0) return;

    trackTikTokEvent('AddPaymentInfo', {
        contents,
        value: getTikTokValueFromLines(lines),
        currency: DEFAULT_CURRENCY,
    });
};

export const trackTikTokPlaceOrder = (lines: TikTokCartLineLike[], value?: number): void => {
    const contents = buildTikTokContentsFromLines(lines);
    if (contents.length === 0) return;

    trackTikTokEvent('PlaceAnOrder', {
        contents,
        value: typeof value === 'number' ? value : getTikTokValueFromLines(lines),
        currency: DEFAULT_CURRENCY,
    });
};

export const trackTikTokPurchase = (lines: TikTokCartLineLike[], value?: number): void => {
    const contents = buildTikTokContentsFromLines(lines);
    if (contents.length === 0) return;

    const resolvedValue = typeof value === 'number' ? value : getTikTokValueFromLines(lines);
    trackTikTokEvent('Purchase', {
        contents,
        value: resolvedValue,
        currency: DEFAULT_CURRENCY,
    });
};

export const toTikTokProductContent = (params: {
    productId: string;
    name: string;
    price: number;
    brand?: string;
}): TikTokContent => ({
    content_id: params.productId,
    content_type: 'product',
    content_name: params.name,
    price: normalizePrice(params.price),
    num_items: 1,
    brand: params.brand || 'Juno',
});
