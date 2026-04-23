import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { APIProvider, Map, AdvancedMarker, useMap } from '@vis.gl/react-google-maps';
import {
    ArrowLeft,
    Package,
    MapPin,
    Clock,
    Truck,
    CheckCircle,
    Share2,
    Store,
    Home,
    Warehouse,
    Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Commerce, GuestCommerce } from '../../api/commerceApi';
import type { GuestOrderLookupRequest, OrderStatus, OrderTracking, TrackingAnchors, TrackingMilestone } from '../../api/api.types';
import { decodePolyline, interpolateAlong, type LatLng } from '../../utils/tracking';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_WEB_KEY;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

type StatusUi = {
    color: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    expectedMinutes?: number;
    moving?: boolean;
};

const STATUS_CONFIG: Record<string, StatusUi> = {
    pending: { color: '#fbbf24', icon: Clock, label: 'Order Placed' },
    confirmed: { color: '#f59e0b', icon: CheckCircle, label: 'Confirmed' },
    packed: { color: '#60a5fa', icon: Package, label: 'Packed' },
    handed_to_rider: { color: '#a855f7', icon: Truck, label: 'Handed To Rider', expectedMinutes: 180, moving: true },
    at_warehouse: { color: '#8b5cf6', icon: Warehouse, label: 'At Warehouse' },
    out_for_delivery: { color: '#ec4899', icon: Truck, label: 'Out For Delivery', expectedMinutes: 120, moving: true },
    delivery_attempted: { color: '#f97316', icon: Truck, label: 'Delivery Attempted', expectedMinutes: 120, moving: true },
    delivered: { color: '#22c55e', icon: CheckCircle, label: 'Delivered' },
    cancelled: { color: '#ef4444', icon: CheckCircle, label: 'Cancelled' },
    returned: { color: '#ef4444', icon: Warehouse, label: 'Returned' },
};

const MOVING_STATUSES = new Set<OrderStatus>(['handed_to_rider', 'out_for_delivery', 'delivery_attempted']);
const ROUTE_TO_WAREHOUSE = new Set<OrderStatus | 'legacy'>(['handed_to_rider', 'at_warehouse']);
const ROUTE_TO_CUSTOMER = new Set<OrderStatus>(['out_for_delivery', 'delivery_attempted', 'delivered', 'returned']);

const Polyline: React.FC<{ points: LatLng[]; color: string; dashed?: boolean; weight?: number }> = ({ points, color, dashed, weight = 4 }) => {
    const map = useMap();
    const polylineRef = useRef<google.maps.Polyline | null>(null);

    useEffect(() => {
        if (!map || points.length < 2) return;

        polylineRef.current = new google.maps.Polyline({
            path: points,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: dashed ? 0 : 1,
            strokeWeight: weight,
            map,
            icons: dashed
                ? [{
                    icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
                    offset: '0',
                    repeat: '20px',
                }]
                : [],
        });

        return () => polylineRef.current?.setMap(null);
    }, [map, points, color, dashed, weight]);

    return null;
};

const asStatus = (value: string): OrderStatus | 'legacy' => {
    return (value in STATUS_CONFIG ? value : 'legacy') as OrderStatus | 'legacy';
};

const statusLabel = (value: string): string => {
    return STATUS_CONFIG[value]?.label ?? value.replace(/_/g, ' ');
};

const resolvePolyline = (body: unknown): string | null => {
    if (typeof body === 'string' && body.trim().length > 0) return body;
    const maybe = body as { polyline?: unknown } | null;
    if (typeof maybe?.polyline === 'string' && maybe.polyline.trim().length > 0) return maybe.polyline;
    return null;
};

const buildFallbackPath = (anchors: TrackingAnchors, status: OrderStatus | 'legacy'): LatLng[] => {
    const seller = anchors.seller;
    const warehouse = anchors.warehouse;
    const customer = anchors.customer;

    if (ROUTE_TO_WAREHOUSE.has(status)) {
        return warehouse ? [seller, warehouse] : [seller, customer];
    }
    if (ROUTE_TO_CUSTOMER.has(status)) {
        return warehouse ? [warehouse, customer] : [seller, customer];
    }
    return [seller, customer];
};

const getStatusStart = (timelineAsc: TrackingMilestone[], status: string): Date | null => {
    const match = [...timelineAsc].reverse().find((item) => item.status === status);
    if (!match) return null;
    const parsed = new Date(match.occurred_at);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
};

const estimateSegmentProgress = (
    status: OrderStatus | 'legacy',
    startedAt: Date | null,
    nowMs: number
): number => {
    if (status === 'delivered') return 1;
    if (status === 'at_warehouse') return 1;
    if (status === 'delivery_attempted') return 0.95;
    if (!MOVING_STATUSES.has(status as OrderStatus)) return 0;
    if (!startedAt) return 0;

    const minutes = STATUS_CONFIG[status]?.expectedMinutes ?? 180;
    const elapsedMs = Math.max(0, nowMs - startedAt.getTime());
    const expectedMs = minutes * 60 * 1000;
    if (expectedMs <= 0) return 0;
    return Math.min(0.95, elapsedMs / expectedMs);
};

const formatEtaCountdown = (eta?: string): string | null => {
    if (!eta) return null;
    const etaMs = new Date(eta).getTime();
    if (!Number.isFinite(etaMs)) return null;
    const delta = etaMs - Date.now();
    if (delta <= 0) return 'Arriving today';

    const totalMinutes = Math.floor(delta / 60000);
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

const makeAbsoluteUrl = (url: string): string => {
    if (/^https?:\/\//i.test(url)) return url;
    return `${window.location.origin}${url.startsWith('/') ? url : `/${url}`}`;
};

const PAK_CITY_COORDS: Record<string, LatLng> = {
    lahore: { lat: 31.5204, lng: 74.3587 },
    karachi: { lat: 24.8607, lng: 67.0011 },
    islamabad: { lat: 33.6844, lng: 73.0479 },
    rawalpindi: { lat: 33.5651, lng: 73.0169 },
    faisalabad: { lat: 31.4504, lng: 73.1350 },
    multan: { lat: 30.1575, lng: 71.5249 },
    peshawar: { lat: 34.0151, lng: 71.5249 },
    quetta: { lat: 30.1798, lng: 66.9750 },
    gujranwala: { lat: 32.1617, lng: 74.1883 },
    sialkot: { lat: 32.4945, lng: 74.5229 },
    hyderabad: { lat: 25.3960, lng: 68.3578 },
};

const normalizeCityKey = (value?: string): string => {
    if (!value) return '';
    return value.toLowerCase().replace(/[^a-z]/g, '');
};

const findPakCityCoords = (value?: string): LatLng | null => {
    const normalized = normalizeCityKey(value);
    if (!normalized) return null;
    for (const [city, coords] of Object.entries(PAK_CITY_COORDS)) {
        if (normalized.includes(city)) return coords;
    }
    return null;
};

const isInvalidGeoPoint = (point?: LatLng): boolean => {
    if (!point) return true;
    if (!Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return true;
    if (point.lat < -90 || point.lat > 90 || point.lng < -180 || point.lng > 180) return true;
    // Gulf of Guinea/default-null style coordinates
    if (Math.abs(point.lat) < 0.01 && Math.abs(point.lng) < 0.01) return true;
    return false;
};

const isLikelyPakistanPoint = (point: LatLng): boolean => {
    return point.lat >= 23 && point.lat <= 38 && point.lng >= 60 && point.lng <= 78;
};

const sanitizeTrackingAnchors = (anchors: TrackingAnchors): TrackingAnchors => {
    if (!anchors?.customer) return anchors;
    const customer = anchors.customer;
    const cityFallback = findPakCityCoords(customer.city) ?? findPakCityCoords(customer.label);
    const fallback = cityFallback ?? PAK_CITY_COORDS.lahore;

    if (isInvalidGeoPoint(customer) || !isLikelyPakistanPoint(customer)) {
        return {
            ...anchors,
            customer: {
                ...customer,
                lat: fallback.lat,
                lng: fallback.lng,
                city: customer.city || (cityFallback ? Object.keys(PAK_CITY_COORDS).find((k) => PAK_CITY_COORDS[k] === cityFallback) : 'Lahore'),
            },
        };
    }

    return anchors;
};

const buildGuestTrackingCandidates = (orderId: string, orders: { id: string; child_order_ids?: string[] }[]): string[] => {
    const allChildIds = Array.from(
        new Set(
            orders.flatMap((order) => order.child_order_ids ?? []).filter((id) => !!id)
        )
    );

    const parentMatch = orders.find((order) => order.id === orderId);
    if (parentMatch?.child_order_ids?.length) {
        return Array.from(new Set(parentMatch.child_order_ids));
    }

    const childMatch = orders.find((order) => order.child_order_ids?.includes(orderId));
    if (childMatch) {
        return [orderId];
    }

    return Array.from(new Set([orderId, ...allChildIds]));
};

const InteractiveTrackingPage: React.FC = () => {
    const { token, orderId } = useParams<{ token?: string; orderId?: string }>();
    const [searchParams] = useSearchParams();
    const [tracking, setTracking] = useState<OrderTracking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTimeline, setShowTimeline] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSharing, setIsSharing] = useState(false);

    const isPublic = !!token;
    const guestPhoneNumber = searchParams.get('phone_number')?.trim() || '';
    const guestEmail = searchParams.get('email')?.trim() || '';
    const hasGuestProof = !isPublic && (!!guestPhoneNumber || !!guestEmail);
    const previousStatusRef = useRef<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!token && !orderId) {
                setError('Invalid tracking link.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const guestProof: GuestOrderLookupRequest = {
                    phone_number: guestPhoneNumber || undefined,
                    email: guestEmail || undefined,
                };
                let trackingResponse;

                if (isPublic) {
                    trackingResponse = await GuestCommerce.getPublicTracking(token!);
                } else if (hasGuestProof) {
                    const lookupResponse = await GuestCommerce.lookupOrders(guestProof);
                    if (!lookupResponse.ok || !Array.isArray(lookupResponse.body) || lookupResponse.body.length === 0) {
                        throw new Error('Unable to verify guest order with provided phone/email.');
                    }

                    const candidates = buildGuestTrackingCandidates(orderId!, lookupResponse.body);
                    let resolved = null;
                    for (const candidateId of candidates) {
                        const attempt = await GuestCommerce.getGuestOrderTracking(candidateId, guestProof);
                        if (attempt.ok && attempt.body) {
                            resolved = attempt;
                            break;
                        }
                    }

                    trackingResponse = resolved ?? { ok: false, status: 404, body: null };
                } else {
                    trackingResponse = await Commerce.getOrderTracking(orderId!);
                }

                if (!trackingResponse.ok || !trackingResponse.body) {
                    throw new Error(isPublic
                        ? 'Tracking information not found for this link.'
                        : hasGuestProof
                            ? 'Unable to load guest tracking. Verify your phone/email and order ID.'
                            : 'Unable to load tracking. If this is a guest order, open tracking from lookup or use a shared link.');
                }

                const nextTracking = trackingResponse.body;
                nextTracking.anchors = sanitizeTrackingAnchors(nextTracking.anchors);

                if (!nextTracking.polyline && !isPublic && orderId && !hasGuestProof) {
                    const polylineResponse = await Commerce.getOrderTrackingPolyline(orderId);
                    const resolved = polylineResponse.ok ? resolvePolyline(polylineResponse.body) : null;
                    if (resolved) {
                        nextTracking.polyline = resolved;
                    }
                }

                const didJustDeliver =
                    previousStatusRef.current !== 'delivered' &&
                    nextTracking.current_status === 'delivered';

                setTracking(nextTracking);
                setError(null);

                if (didJustDeliver) {
                    confetti({
                        particleCount: 140,
                        spread: 75,
                        origin: { y: 0.6 },
                        colors: ['#ec4899', '#8b5cf6', '#22c55e'],
                    });
                }

                previousStatusRef.current = nextTracking.current_status;
            } catch (err) {
                setTracking(null);
                setError(err instanceof Error ? err.message : 'Failed to load tracking data.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const intervalId = window.setInterval(fetchData, 30000);
        return () => window.clearInterval(intervalId);
    }, [token, orderId, isPublic, hasGuestProof, guestPhoneNumber, guestEmail]);

    const timelineAsc = useMemo(() => {
        if (!tracking?.timeline?.length) return [];
        return [...tracking.timeline].sort(
            (a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()
        );
    }, [tracking?.timeline]);

    const timelineDesc = useMemo(() => [...timelineAsc].reverse(), [timelineAsc]);

    const activeStatus = useMemo(() => asStatus(tracking?.current_status ?? 'pending'), [tracking?.current_status]);
    const statusConfig = STATUS_CONFIG[activeStatus] ?? STATUS_CONFIG.pending;

    const rawPath = useMemo(() => {
        if (!tracking) return [];
        if (tracking.polyline) {
            const decoded = decodePolyline(tracking.polyline);
            if (decoded.length > 1) return decoded;
        }
        return buildFallbackPath(tracking.anchors, activeStatus);
    }, [tracking, activeStatus]);

    useEffect(() => {
        if (!tracking || rawPath.length < 2) {
            setProgress(0);
            return;
        }

        const refresh = () => {
            const startedAt = getStatusStart(timelineAsc, tracking.current_status);
            const next = estimateSegmentProgress(activeStatus, startedAt, Date.now());
            setProgress(next);
        };

        refresh();
        const intervalId = window.setInterval(refresh, 1000);
        return () => window.clearInterval(intervalId);
    }, [tracking, rawPath.length, timelineAsc, activeStatus]);

    const parcelPosition = useMemo(() => {
        if (rawPath.length < 2) return null;
        return interpolateAlong(rawPath, progress);
    }, [rawPath, progress]);

    const traveledPath = useMemo(() => {
        if (rawPath.length < 2) return [];
        if (progress <= 0) return [rawPath[0]];
        const count = Math.max(2, Math.floor(rawPath.length * progress));
        return rawPath.slice(0, count);
    }, [rawPath, progress]);

    const remainingPath = useMemo(() => {
        if (rawPath.length < 2) return [];
        if (progress >= 1) return [];
        const startIndex = Math.max(0, Math.floor(rawPath.length * progress) - 1);
        return rawPath.slice(startIndex);
    }, [rawPath, progress]);

    const etaCountdown = useMemo(() => formatEtaCountdown(tracking?.estimated_delivery), [tracking?.estimated_delivery]);

    const handleShare = async () => {
        if (isSharing) return;
        setIsSharing(true);
        try {
            let shareUrl = window.location.href;
            if (!isPublic && orderId && !hasGuestProof) {
                const response = await Commerce.shareOrderTracking(orderId);
                if (response.ok && response.body?.url) {
                    shareUrl = makeAbsoluteUrl(response.body.url);
                }
            }

            const shareText = 'Track this Juno order';
            if (navigator.share) {
                await navigator.share({ title: 'Juno Order Tracking', text: shareText, url: shareUrl });
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareUrl);
            }
        } finally {
            setIsSharing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !tracking) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-4 text-center text-white">
                <div className="mb-6 rounded-full bg-red-500/10 p-4 text-red-500">
                    <Package size={48} />
                </div>
                <h1 className="mb-2 text-2xl font-black uppercase tracking-tight">Tracking Not Available</h1>
                <p className="mb-8 max-w-md text-white/60">{error || 'Unable to load tracking details.'}</p>
                <Link to={isPublic ? '/' : '/track'} className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black">
                    {isPublic ? 'Back to Home' : 'Back to Tracking'}
                </Link>
            </div>
        );
    }

    if (!GOOGLE_MAPS_API_KEY) {
        return (
            <div className="min-h-screen bg-[#050505] px-4 pb-12 pt-24 text-white">
                <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                    <h1 className="text-2xl font-black uppercase tracking-tight">{statusLabel(tracking.current_status)}</h1>
                    <p className="mt-2 text-white/60">Map key is missing. Timeline is still available below.</p>
                    <div className="mt-6 space-y-4">
                        {timelineDesc.map((milestone, index) => (
                            <div key={`${milestone.status}-${milestone.occurred_at}-${index}`} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-sm font-bold uppercase">{milestone.label}</p>
                                <p className="mt-1 text-xs text-white/55">
                                    {new Date(milestone.occurred_at).toLocaleString('en-PK')}
                                </p>
                                {milestone.note ? <p className="mt-2 text-sm text-white/70">{milestone.note}</p> : null}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const isAtWarehouse = tracking.current_status === 'at_warehouse';
    const showParcel = !!parcelPosition && activeStatus !== 'pending' && activeStatus !== 'confirmed' && activeStatus !== 'packed' && activeStatus !== 'cancelled';

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                    defaultCenter={tracking.anchors.customer}
                    defaultZoom={11}
                    mapId={MAP_ID}
                    disableDefaultUI
                    className="h-full w-full"
                >
                    {traveledPath.length > 1 ? <Polyline points={traveledPath} color={statusConfig.color} /> : null}
                    {remainingPath.length > 1 ? <Polyline points={remainingPath} color="#ffffff55" dashed /> : null}

                    <AdvancedMarker position={tracking.anchors.seller}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black shadow-xl">
                            <Store size={20} className="text-white" />
                        </div>
                    </AdvancedMarker>

                    {tracking.anchors.warehouse ? (
                        <AdvancedMarker position={tracking.anchors.warehouse}>
                            <div className="relative">
                                {isAtWarehouse ? (
                                    <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/20" />
                                ) : null}
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black shadow-xl">
                                    <Warehouse size={20} className="text-white" />
                                </div>
                            </div>
                        </AdvancedMarker>
                    ) : null}

                    <AdvancedMarker position={tracking.anchors.customer}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary shadow-xl">
                            <Home size={20} className="text-white" />
                        </div>
                    </AdvancedMarker>

                    {showParcel ? (
                        <AdvancedMarker position={parcelPosition}>
                            <div className="relative">
                                <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-primary/30" />
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-2xl ring-2 ring-white">
                                    <Truck size={16} className="text-white" />
                                </div>
                            </div>
                        </AdvancedMarker>
                    ) : null}
                </Map>
            </APIProvider>

            <div className="absolute left-0 right-0 top-0 p-4">
                <div className="flex items-center justify-between gap-4">
                    <Link to={isPublic ? '/' : '/track'} className="flex h-12 w-12 items-center justify-center rounded-full bg-black/80 backdrop-blur-md">
                        <ArrowLeft size={20} />
                    </Link>

                    <div className="flex-1 rounded-full bg-black/80 px-6 py-3 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Current Status</p>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: statusConfig.color }} />
                                    <p className="text-sm font-black uppercase tracking-tight">{statusLabel(tracking.current_status)}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">ETA</p>
                                <p className="text-sm font-black uppercase tracking-tight">{etaCountdown || 'TBD'}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-black/80 backdrop-blur-md disabled:opacity-60"
                        aria-label="Share tracking link"
                    >
                        {isSharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={20} />}
                    </button>
                </div>
            </div>

            <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y < -40) setShowTimeline(true);
                    if (info.offset.y > 40) setShowTimeline(false);
                }}
                className="absolute bottom-0 left-0 right-0 z-50 rounded-t-[2.5rem] bg-black/90 p-6 shadow-2xl backdrop-blur-xl"
                initial={{ y: '58%' }}
                animate={{ y: showTimeline ? '0%' : '58%' }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            >
                <button
                    className="mx-auto mb-6 block h-1.5 w-12 rounded-full bg-white/20"
                    onClick={() => setShowTimeline((prev) => !prev)}
                    aria-label="Toggle timeline"
                />

                <div className="mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Order Timeline</h2>
                    <p className="text-sm text-white/50">Live milestone updates</p>
                </div>

                <div className="max-h-[50vh] space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                    {timelineDesc.map((milestone, index) => {
                        const config = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.pending;
                        const Icon = config.icon;
                        const isLatest = index === 0;
                        const isLast = index === timelineDesc.length - 1;

                        return (
                            <div key={`${milestone.status}-${milestone.occurred_at}-${index}`} className="relative flex gap-4">
                                {!isLast ? <div className="absolute left-[15px] top-8 h-full w-[2px] bg-white/10" /> : null}
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10"
                                    style={isLatest ? { backgroundColor: `${config.color}30` } : undefined}
                                >
                                    <Icon size={14} className={isLatest ? '' : 'text-white/40'} style={isLatest ? { color: config.color } : undefined} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className={`text-sm font-bold uppercase tracking-tight ${isLatest ? 'text-white' : 'text-white/60'}`}>
                                            {milestone.label}
                                        </h3>
                                        <span className="text-[10px] font-medium text-white/40">
                                            {new Date(milestone.occurred_at).toLocaleString('en-PK', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                    {milestone.note ? <p className="mt-1 text-xs leading-relaxed text-white/40">{milestone.note}</p> : null}
                                    {milestone.location?.city ? (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-white/30">
                                            <MapPin size={10} />
                                            {milestone.location.city}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default InteractiveTrackingPage;
