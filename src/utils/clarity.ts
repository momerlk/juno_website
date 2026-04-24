import Clarity from '@microsoft/clarity';

const CLARITY_PROJECT_ID = 'wg8on3pocf';
const CLARITY_GUEST_ID_KEY = 'juno_clarity_guest_id';

let clarityInitialized = false;

type ConsentValue = 'granted' | 'denied';

export type ClarityConsentOptions = {
    ad_Storage: ConsentValue;
    analytics_Storage: ConsentValue;
};

type ClarityTagValue = string | string[];
type ClarityRole = 'seller' | 'admin' | 'ambassador' | 'guest';

export type ClarityIdentity = {
    customId: string;
    friendlyName: string;
    role: ClarityRole;
};

const sanitize = (value: unknown): string => String(value ?? '').trim().slice(0, 120);

const inBrowser = (): boolean => typeof window !== 'undefined';

const ensureInitialized = (): boolean => {
    if (!inBrowser()) return false;
    if (clarityInitialized) return true;
    try {
        Clarity.init(CLARITY_PROJECT_ID);
        clarityInitialized = true;
        return true;
    } catch {
        return false;
    }
};

export const initClarity = (): void => {
    ensureInitialized();
};

export const consentClarityV2 = (options?: ClarityConsentOptions): void => {
    if (!ensureInitialized()) return;
    try {
        Clarity.consentV2(options);
    } catch {
        // no-op
    }
};

export const identifyClarity = (
    customId: string,
    customSessionId?: string,
    customPageId?: string,
    friendlyName?: string
): void => {
    if (!ensureInitialized()) return;
    const id = sanitize(customId);
    if (!id) return;
    try {
        Clarity.identify(
            id,
            customSessionId ? sanitize(customSessionId) : undefined,
            customPageId ? sanitize(customPageId) : undefined,
            friendlyName ? sanitize(friendlyName) : undefined
        );
    } catch {
        // no-op
    }
};

const getGuestIdentity = (): ClarityIdentity => {
    const guestId =
        localStorage.getItem(CLARITY_GUEST_ID_KEY) ||
        `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(CLARITY_GUEST_ID_KEY, guestId);
    return { customId: guestId, friendlyName: 'guest', role: 'guest' };
};

export const resolveClarityIdentityFromStorage = (): ClarityIdentity | null => {
    if (!inBrowser()) return null;
    try {
        const sellerToken = localStorage.getItem('token');
        const adminToken = localStorage.getItem('admin_token');
        const ambassadorToken = localStorage.getItem('ambassador_token');

        if (sellerToken) {
            const sellerRaw = localStorage.getItem('seller');
            if (!sellerRaw) return getGuestIdentity();
            const seller = JSON.parse(sellerRaw);
            const sellerId = seller?.user?.id || seller?.user?._id || seller?.user?.email;
            if (sellerId) {
                return {
                    customId: `seller:${sellerId}`,
                    friendlyName: seller?.user?.name || 'seller',
                    role: 'seller',
                };
            }
            return getGuestIdentity();
        }

        if (adminToken) {
            const adminRaw = localStorage.getItem('admin_user');
            if (!adminRaw) return getGuestIdentity();
            const admin = JSON.parse(adminRaw);
            const adminId = admin?.id || admin?.email;
            if (adminId) {
                return {
                    customId: `admin:${adminId}`,
                    friendlyName: admin?.name || 'admin',
                    role: 'admin',
                };
            }
            return getGuestIdentity();
        }

        if (ambassadorToken) {
            const ambassadorRaw = localStorage.getItem('ambassador_data');
            if (!ambassadorRaw) return getGuestIdentity();
            const ambassador = JSON.parse(ambassadorRaw);
            const ambassadorId = ambassador?.id || ambassador?.phone;
            if (ambassadorId) {
                return {
                    customId: `ambassador:${ambassadorId}`,
                    friendlyName: ambassador?.name || 'ambassador',
                    role: 'ambassador',
                };
            }
            return getGuestIdentity();
        }

        return getGuestIdentity();
    } catch {
        return null;
    }
};

export const identifyClarityFromIdentity = (
    identity: ClarityIdentity | null | undefined,
    pathname?: string
): void => {
    if (!identity) return;
    const customPageId = pathname ? `page:${sanitize(pathname)}` : undefined;
    identifyClarity(identity.customId, undefined, customPageId, identity.friendlyName);
};

export const identifyClarityFromStorage = (pathname?: string): void => {
    const identity = resolveClarityIdentityFromStorage();
    identifyClarityFromIdentity(identity, pathname);
};

export const getClarityRoleFromIdentity = (identity: ClarityIdentity | null | undefined): ClarityRole => {
    if (!identity) return 'guest';
    return identity.role;
};

export const getClarityCustomIdFromIdentity = (identity: ClarityIdentity | null | undefined): string => {
    if (!identity) return 'unknown';
    return identity.customId;
};

export const getClarityFriendlyNameFromIdentity = (identity: ClarityIdentity | null | undefined): string => {
    if (!identity) return 'unknown';
    return identity.friendlyName;
};

export const createGuestClarityIdentity = (): ClarityIdentity | null => {
    if (!inBrowser()) return null;
    try {
        return getGuestIdentity();
    } catch {
        return null;
    }
};

export const setClarityTag = (key: string, value: ClarityTagValue): void => {
    if (!ensureInitialized()) return;
    const normalizedKey = sanitize(key);
    if (!normalizedKey) return;
    try {
        const normalizedValue = Array.isArray(value)
            ? value.map((v) => sanitize(v)).filter(Boolean)
            : sanitize(value);
        if ((Array.isArray(normalizedValue) && normalizedValue.length === 0) || (!Array.isArray(normalizedValue) && !normalizedValue)) {
            return;
        }
        Clarity.setTag(normalizedKey, normalizedValue);
    } catch {
        // no-op
    }
};

export const setClarityTags = (tags: Record<string, ClarityTagValue | null | undefined>): void => {
    Object.entries(tags).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        setClarityTag(key, value);
    });
};

export const trackClarityEvent = (eventName: string): void => {
    if (!ensureInitialized()) return;
    const normalizedName = sanitize(eventName);
    if (!normalizedName) return;
    try {
        Clarity.event(normalizedName);
    } catch {
        // no-op
    }
};

export const trackClarityEventWithTags = (
    eventName: string,
    tags?: Record<string, ClarityTagValue | null | undefined>
): void => {
    if (tags) setClarityTags(tags);
    trackClarityEvent(eventName);
};

export const upgradeClaritySession = (reason: string): void => {
    if (!ensureInitialized()) return;
    const normalizedReason = sanitize(reason);
    if (!normalizedReason) return;
    try {
        Clarity.upgrade(normalizedReason);
    } catch {
        // no-op
    }
};
