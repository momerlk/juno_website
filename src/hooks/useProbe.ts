/**
 * Probe Analytics Hook
 * 
 * Provides end-to-end analytics tracking for the Juno website.
 * Automatically tracks page views, user interactions, and commerce events.
 * 
 * @module Probe
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Probe } from '../api/api';

// ============================================================================
// Constants and Types
// ============================================================================

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const HEARTBEAT_INTERVAL_MS = 30 * 1000; // 30 seconds

export type ProbeEventType =
    // Session events
    | 'session.start'
    | 'session.end'
    | 'session.heartbeat'
    // Screen events
    | 'screen.view'
    | 'screen.exit'
    // Navigation events
    | 'navigation.tab_switch'
    | 'navigation.back'
    // Product events
    | 'product.view'
    | 'product.impression'
    | 'product.share'
    | 'product.add_to_closet'
    | 'product.remove_from_closet'
    // Search events
    | 'search.query'
    | 'search.result_click'
    | 'search.no_results'
    | 'search.filter_apply'
    // Commerce events
    | 'cart.add'
    | 'cart.remove'
    | 'cart.view'
    | 'checkout.start'
    | 'checkout.complete'
    | 'checkout.abandon'
    | 'order.placed'
    // Interaction events
    | 'interaction.like'
    | 'interaction.dislike'
    | 'interaction.save'
    | 'interaction.share'
    // Campaign events
    | 'click'
    | 'drops.reminder';

export interface ProbeEventProperties {
    [key: string]: any;
}

export interface ProbeEventContext {
    screen_name?: string;
    referrer?: string;
    source?: string;
    user_agent?: string;
    ip_address?: string;
    campaign_id?: string;
}

// ============================================================================
// Session Management
// ============================================================================

interface SessionData {
    sessionId: string;
    userId?: string;
    campaignId?: string;
    startTime: number;
    lastActivity: number;
    pageCount: number;
    screenHistory: string[];
}

function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function getSessionData(): SessionData | null {
    try {
        const stored = localStorage.getItem('probe_session');
        if (!stored) return null;
        
        const session = JSON.parse(stored) as SessionData;
        const now = Date.now();
        
        // Check if session has expired
        if (now - session.lastActivity > SESSION_TIMEOUT_MS) {
            return null;
        }
        
        return session;
    } catch {
        return null;
    }
}

function saveSessionData(session: SessionData): void {
    try {
        localStorage.setItem('probe_session', JSON.stringify(session));
    } catch {
        // Ignore storage errors
    }
}

function getOrCreateSession(): SessionData {
    const existing = getSessionData();
    if (existing) {
        return existing;
    }
    
    // Create new session
    const newSession: SessionData = {
        sessionId: generateSessionId(),
        userId: undefined,
        campaignId: localStorage.getItem('juno_active_campaign') || undefined,
        startTime: Date.now(),
        lastActivity: Date.now(),
        pageCount: 0,
        screenHistory: [],
    };
    
    saveSessionData(newSession);
    
    // Track session start
    trackEvent('session.start', {
        start_time: new Date().toISOString(),
        campaign_id: newSession.campaignId,
    }, newSession);
    
    return newSession;
}

function updateSessionActivity(session: SessionData): SessionData {
    const updated = { ...session, lastActivity: Date.now() };
    saveSessionData(updated);
    return updated;
}

function incrementPageCount(session: SessionData): SessionData {
    const updated = { 
        ...session, 
        pageCount: session.pageCount + 1,
        lastActivity: Date.now() 
    };
    saveSessionData(updated);
    return updated;
}

function addScreenToHistory(session: SessionData, screenName: string): SessionData {
    const updated = {
        ...session,
        screenHistory: [...session.screenHistory, screenName],
        lastActivity: Date.now(),
    };
    saveSessionData(updated);
    return updated;
}

// ============================================================================
// Event Tracking
// ============================================================================

let eventQueue: Array<{
    type: ProbeEventType;
    properties?: ProbeEventProperties;
    context?: ProbeEventContext;
    productId?: string;
    categoryId?: string;
    campaignId?: string;
    timestamp: string;
}> = [];

let flushTimer: NodeJS.Timeout | null = null;

/**
 * Track an event immediately or queue it for batching
 */
export function trackEvent(
    type: ProbeEventType,
    properties?: ProbeEventProperties,
    session?: SessionData,
    context?: ProbeEventContext,
    productId?: string,
    categoryId?: string
): void {
    const currentSession = session || getOrCreateSession();
    
    // Auto-inject campaign ID if present in session or localStorage
    const activeCampaignId = currentSession.campaignId || localStorage.getItem('juno_active_campaign');
    
    const finalProperties = {
        ...properties,
        ...(activeCampaignId ? { campaign_id: activeCampaignId } : {}),
    };

    const finalContext = {
        ...context,
        ...(activeCampaignId ? { campaign_id: activeCampaignId } : {}),
    };
    
    const event: typeof eventQueue[number] = {
        type,
        properties: finalProperties,
        context: finalContext,
        productId,
        categoryId,
        campaignId: activeCampaignId || undefined,
        timestamp: new Date().toISOString(),
    };
    
    eventQueue.push(event);
    
    // Flush immediately for critical lifecycle/campaign events
    const isCritical = [
        'session.start', 
        'session.end', 
        'checkout.complete', 
        'order.placed', 
        'click', 
        'checkout.start'
    ].includes(type);

    if (isCritical) {
        flushEvents(currentSession);
    } else {
        // Batch other events
        if (!flushTimer) {
            flushTimer = setTimeout(() => {
                flushEvents(currentSession);
            }, 1000);
        }
    }
}

/**
 * Flush queued events to the backend
 */
async function flushEvents(session: SessionData): Promise<void> {
    if (eventQueue.length === 0) return;
    
    const eventsToFlush = [...eventQueue];
    eventQueue = [];
    
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    
    try {
        const device = await getDeviceInfo();
        
        await Probe.ingestEvents({
            session_id: session.sessionId,
            user_id: session.userId,
            device,
            events: eventsToFlush.map(event => ({
                type: event.type,
                product_id: event.productId,
                category_id: event.categoryId,
                campaign_id: event.campaignId,
                timestamp: event.timestamp,
                properties: event.properties,
                context: event.context,
            })),
        });
    } catch (error) {
        // Re-queue events on failure
        eventQueue = [...eventsToFlush, ...eventQueue];
        console.warn('Failed to flush Probe events:', error);
    }
}

/**
 * Get device information for analytics
 */
async function getDeviceInfo(): Promise<Probe.ProbeDevice> {
    const appVersion = '1.0.0';
    let deviceId = localStorage.getItem('probe_device_id');
    
    if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem('probe_device_id', deviceId);
    }
    
    const ua = navigator.userAgent;
    let platform = 'web';
    let osVersion = 'unknown';
    
    if (/Android/.test(ua)) {
        platform = 'android';
        osVersion = ua.match(/Android\s([0-9.]+)/)?.[1] || 'unknown';
    } else if (/iPhone|iPad|iPod/.test(ua)) {
        platform = 'ios';
        osVersion = ua.match(/OS\s([0-9_]+)/)?.[1].replace(/_/g, '.') || 'unknown';
    } else if (/Windows NT/.test(ua)) {
        platform = 'windows';
        osVersion = ua.match(/Windows NT\s([0-9.]+)/)?.[1] || 'unknown';
    } else if (/Mac OS X/.test(ua)) {
        platform = 'macos';
        osVersion = ua.match(/Mac OS X\s([0-9_]+)/)?.[1].replace(/_/g, '.') || 'unknown';
    } else if (/Linux/.test(ua)) {
        platform = 'linux';
    }
    
    return {
        device_id: deviceId,
        platform,
        app_version: appVersion,
        os_version: osVersion,
        locale: navigator.language,
    };
}

/**
 * Send session heartbeat
 */
async function sendHeartbeat(session: SessionData, screenName?: string): Promise<void> {
    try {
        const device = await getDeviceInfo();
        const currentScreen = screenName || getScreenNameFromLocation(window.location);
        
        await Probe.heartbeat({
            session_id: session.sessionId,
            user_id: session.userId,
            campaign_id: session.campaignId,
            device,
            screen_name: currentScreen,
            page_count: session.pageCount,
            metadata: {
                url: window.location.href,
                referrer: document.referrer,
            },
        });
    } catch (error) {
        console.warn('Failed to send heartbeat:', error);
    }
}

// ============================================================================
// React Hooks
// ============================================================================

/**
 * Initialize Probe analytics and track page views
 * 
 * @example
 * ```tsx
 * function App() {
 *     useProbeAnalytics();
 *     
 *     return <Router>...</Router>;
 * }
 * ```
 */
export function useProbeAnalytics(): void {
    const location = useLocation();
    const sessionRef = useRef<SessionData | null>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousScreenRef = useRef<string>('');
    
    // Lifecycle management (Init session & campaign once)
    useEffect(() => {
        // Campaign detection
        const params = new URLSearchParams(window.location.search);
        const campaignId = extractCampaignId(location);

        if (campaignId) {
            localStorage.setItem('juno_active_campaign', campaignId);
            
            // If session already exists in storage, update its campaign ID
            const session = getSessionData();
            if (session && !session.campaignId) {
                session.campaignId = campaignId;
                saveSessionData(session);
            }
        }

        // Initialize session (tracks session.start)
        sessionRef.current = getOrCreateSession();
        
        // Track initial click if landing with campaign context
        if (campaignId) {
            trackEvent('click', {
                campaign_id: campaignId,
                source: params.get('utm_source') || 'organic',
                medium: params.get('utm_medium') || 'direct',
                content: params.get('utm_content') || undefined,
                term: params.get('utm_term') || undefined,
            }, sessionRef.current);
        }

        // Start heartbeat interval
        heartbeatIntervalRef.current = setInterval(() => {
            if (sessionRef.current) {
                sendHeartbeat(sessionRef.current, previousScreenRef.current);
            }
        }, HEARTBEAT_INTERVAL_MS);
        
        // Cleanup on unmount
        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            
            // Track session end
            if (sessionRef.current) {
                trackEvent('session.end', {
                    end_time: new Date().toISOString(),
                    duration_ms: Date.now() - sessionRef.current.startTime,
                }, sessionRef.current);
                
                // Flush remaining events
                flushEvents(sessionRef.current);
            }
        };
    }, []); // Only run once on mount
    
    // Track page views
    useEffect(() => {
        if (!sessionRef.current) return;
        
        const screenName = getScreenNameFromLocation(location);
        const previousScreen = previousScreenRef.current;
        const campaignId = extractCampaignId(location) || localStorage.getItem('juno_active_campaign');
        
        // Track screen exit
        if (previousScreen) {
            trackEvent('screen.exit', {
                screen_name: previousScreen,
                duration_ms: Date.now(),
            }, sessionRef.current, {
                screen_name: previousScreen,
                referrer: previousScreen,
            });
        }
        
        // Update session
        sessionRef.current = incrementPageCount(sessionRef.current);
        sessionRef.current = addScreenToHistory(sessionRef.current, screenName);
        sessionRef.current = updateSessionActivity(sessionRef.current);
        
        // Screen view properties
        const screenProps: any = {
            screen_name: screenName,
            path: location.pathname,
            search: location.search,
        };

        // Add campaign slug for attribution on landing pages
        if (screenName === 'campaign_landing') {
            screenProps.slug = location.pathname.split('/')[2];
        }

        if (campaignId) {
            screenProps.campaign_id = campaignId;
        }
        
        // Track screen view
        trackEvent('screen.view', screenProps, sessionRef.current, {
            screen_name: screenName,
            referrer: previousScreen,
            source: getTrafficSource(),
            campaign_id: campaignId || undefined,
        });
        
        previousScreenRef.current = screenName;
    }, [location.pathname, location.search]); // Trigger on URL changes
}

/**
 * Track product view
 * 
 * @example
 * ```tsx
 * const { trackProductView } = useProbe();
 * 
 * useEffect(() => {
 *     trackProductView(product.id, product.category_id);
 * }, [product.id]);
 * ```
 */
export function useTrackProductView(productId?: string, categoryId?: string): void {
    const sessionRef = useRef<SessionData | null>(null);
    
    useEffect(() => {
        if (!productId || !sessionRef.current) return;
        
        sessionRef.current = sessionRef.current || getOrCreateSession();
        
        trackEvent('product.view', {
            viewed_at: new Date().toISOString(),
        }, sessionRef.current, {
            screen_name: 'product_detail',
        }, productId, categoryId);
    }, [productId, categoryId]);
}

/**
 * Track search query
 * 
 * @example
 * ```tsx
 * const { trackSearch } = useProbe();
 * 
 * const handleSearch = (query: string) => {
 *     trackSearch(query);
 * };
 * ```
 */
export function useTrackSearch(): {
    trackSearch: (query: string, resultCount?: number) => void;
    trackSearchClick: (productId: string, position?: number) => void;
    trackNoResults: (query: string) => void;
} {
    const sessionRef = useRef<SessionData | null>(null);
    
    const trackSearch = useCallback((query: string, resultCount?: number) => {
        sessionRef.current = sessionRef.current || getOrCreateSession();
        
        trackEvent('search.query', {
            query,
            result_count: resultCount,
            searched_at: new Date().toISOString(),
        }, sessionRef.current!, {
            screen_name: 'search',
        });
    }, []);
    
    const trackSearchClick = useCallback((productId: string, position?: number) => {
        sessionRef.current = sessionRef.current || getOrCreateSession();
        
        trackEvent('search.result_click', {
            product_id: productId,
            position,
            clicked_at: new Date().toISOString(),
        }, sessionRef.current!, {
            screen_name: 'search_results',
        }, productId);
    }, []);
    
    const trackNoResults = useCallback((query: string) => {
        sessionRef.current = sessionRef.current || getOrCreateSession();
        
        trackEvent('search.no_results', {
            query,
            searched_at: new Date().toISOString(),
        }, sessionRef.current!, {
            screen_name: 'search_results',
        });
    }, []);
    
    return { trackSearch, trackSearchClick, trackNoResults };
}

/**
 * Track commerce events
 * 
 * @example
 * ```tsx
 * const { trackAddToCart, trackCheckout, trackPurchase } = useProbeCommerce();
 * 
 * const handleAddToCart = (product) => {
 *     trackAddToCart(product.id, product.quantity);
 * };
 * 
 * const handleCheckout = () => {
 *     trackCheckout({ total: cartTotal });
 * };
 * ```
 */
export function useProbeCommerce(): {
    trackAddToCart: (productId: string, quantity?: number, price?: number) => void;
    trackRemoveFromCart: (productId: string) => void;
    trackCartView: (itemCount?: number, total?: number) => void;
    trackCheckoutStart: (total?: number, itemCount?: number) => void;
    trackCheckoutComplete: (orderId: string, total: number) => void;
    trackCheckoutAbandon: (step?: string, total?: number) => void;
} {
    const sessionRef = useRef<SessionData | null>(null);
    
    const trackAddToCart = useCallback((productId: string, quantity?: number, price?: number) => {
        sessionRef.current = sessionRef.current || getOrCreateSession();
        
        trackEvent('cart.add', {
            quantity,
            price,
            added_at: new Date().toISOString(),
        }, sessionRef.current!, {
            screen_name: 'product_detail',
        }, productId);
    }, []);
    
    const trackRemoveFromCart = useCallback((productId: string) => {
        sessionRef.current = sessionRef.current || getOrCreateSession();
        
        trackEvent('cart.remove', {
            removed_at: new Date().toISOString(),
        }, sessionRef.current!, {
            screen_name: 'cart',
        }, productId);
    }, []);
    
    const trackCartView = useCallback((itemCount?: number, total?: number) => {
        sessionRef.current = sessionRef.current || getOrCreateSession();
        
        trackEvent('cart.view', {
            item_count: itemCount,
            total,
            viewed_at: new Date().toISOString(),
        }, sessionRef.current!, {
            screen_name: 'cart',
        });
    }, []);
    
    const trackCheckoutStart = useCallback((total?: number, itemCount?: number) => {
        sessionRef.current = sessionRef.current || getOrCreateSession();
        
        trackEvent('checkout.start', {
            total,
            item_count: itemCount,
            started_at: new Date().toISOString(),
        }, sessionRef.current!, {
            screen_name: 'checkout',
        });
    }, []);
    
    const trackCheckoutComplete = useCallback((orderId: string, total: number) => {
        sessionRef.current = sessionRef.current || getOrCreateSession();
        
        trackEvent('checkout.complete', {
            order_id: orderId,
            total,
            completed_at: new Date().toISOString(),
        }, sessionRef.current!, {
            screen_name: 'checkout_confirmation',
        });
    }, []);
    
    const trackCheckoutAbandon = useCallback((step?: string, total?: number) => {
        sessionRef.current = sessionRef.current || getOrCreateSession();
        
        trackEvent('checkout.abandon', {
            step,
            total,
            abandoned_at: new Date().toISOString(),
        }, sessionRef.current!, {
            screen_name: 'checkout',
        });
    }, []);
    
    return {
        trackAddToCart,
        trackRemoveFromCart,
        trackCartView,
        trackCheckoutStart,
        trackCheckoutComplete,
        trackCheckoutAbandon,
    };
}

/**
 * Main Probe hook - provides all tracking functions
 * 
 * @example
 * ```tsx
 * function ProductPage({ product }) {
 *     const { track } = useProbe();
 *     
 *     useEffect(() => {
 *         track('product.view', { product_id: product.id });
 *     }, [product.id]);
 *     
 *     return <div>...</div>;
 * }
 * ```
 */
export function useProbe(): {
    track: (
        type: ProbeEventType,
        properties?: ProbeEventProperties,
        context?: ProbeEventContext
    ) => void;
    trackDropReminder: (dropId: string) => void;
    session: SessionData | null;
} {
    const sessionRef = useRef<SessionData | null>(null);
    
    if (!sessionRef.current) {
        sessionRef.current = getOrCreateSession();
    }
    
    const track = useCallback((
        type: ProbeEventType,
        properties?: ProbeEventProperties,
        context?: ProbeEventContext
    ) => {
        trackEvent(type, properties, sessionRef.current!, context);
    }, []);

    const trackDropReminder = useCallback((dropId: string) => {
        trackEvent('drops.reminder', {
            drop_id: dropId,
            signed_up_at: new Date().toISOString(),
        }, sessionRef.current!, {
            screen_name: 'drop_detail',
        });
    }, []);
    
    return {
        track,
        trackDropReminder,
        session: sessionRef.current,
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

function extractCampaignId(location: any): string | null {
    const params = new URLSearchParams(location.search);
    
    // 1. Check UTM parameter
    const utmCampaign = params.get('utm_campaign');
    if (utmCampaign) return utmCampaign;
    
    // 2. Check campaign slug pattern (/c/slug)
    if (location.pathname.startsWith('/c/')) {
        return location.pathname.split('/')[2];
    }
    
    // 3. Fallback to generic campaign parameter
    return params.get('campaign');
}

function getScreenNameFromLocation(location: Location): string {
    const path = location.pathname;
    
    if (path === '/') return 'home';
    if (path.startsWith('/product/')) return 'product_detail';
    if (path.startsWith('/brand/')) return 'brand_page';
    if (path.startsWith('/c/')) return 'campaign_landing';
    if (path.startsWith('/blog/')) return 'blog_post';
    if (path === '/blog') return 'blog_index';
    if (path.startsWith('/seller') || path.startsWith('/studio')) return 'seller_portal';
    if (path.startsWith('/admin')) return 'admin_dashboard';
    if (path.startsWith('/ambassador')) return 'ambassador_dashboard';
    if (path.startsWith('/work')) return 'work_dashboard';
    if (path.startsWith('/search')) return 'search_results';
    if (path.startsWith('/cart')) return 'cart';
    if (path.startsWith('/checkout')) return 'checkout';
    if (path.startsWith('/orders')) return 'orders';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/privacy')) return 'privacy_policy';
    if (path.startsWith('/refund')) return 'refund_policy';
    if (path.startsWith('/terms')) return 'terms_conditions';
    
    return 'unknown';
}

function getTrafficSource(): string {
    const referrer = document.referrer;
    const params = new URLSearchParams(window.location.search);
    
    // Check UTM parameters first
    const utmSource = params.get('utm_source');
    if (utmSource) return utmSource;
    
    // Check referrer
    if (referrer) {
        try {
            const url = new URL(referrer);
            if (url.hostname.includes('google')) return 'google';
            if (url.hostname.includes('facebook') || url.hostname.includes('fb')) return 'facebook';
            if (url.hostname.includes('instagram')) return 'instagram';
            if (url.hostname.includes('twitter') || url.hostname.includes('x.com')) return 'twitter';
            if (url.hostname.includes('tiktok')) return 'tiktok';
            return url.hostname;
        } catch {
            return 'direct';
        }
    }
    
    return 'direct';
}

/**
 * Set the current user ID for authenticated tracking
 */
export function setProbeUser(userId: string): void {
    const session = getOrCreateSession();
    session.userId = userId;
    saveSessionData(session);
}

/**
 * Clear session data (on logout)
 */
export function clearProbeSession(): void {
    trackEvent('session.end', {
        end_time: new Date().toISOString(),
        reason: 'logout',
    });
    
    localStorage.removeItem('probe_session');
}
