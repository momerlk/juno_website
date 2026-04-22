import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    APIProvider, 
    Map, 
    AdvancedMarker, 
    useMap, 
    Pin 
} from '@vis.gl/react-google-maps';
import { 
    ArrowLeft, 
    Package, 
    MapPin, 
    Clock, 
    Truck, 
    CheckCircle, 
    ChevronUp, 
    Share2,
    Store,
    Home,
    Warehouse
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Commerce, GuestCommerce } from '../../api/commerceApi';
import type { OrderTracking, TrackingMilestone } from '../../api/api.types';
import { decodePolyline, interpolateAlong } from '../../utils/tracking';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_WEB_KEY;
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;

// Status colors and icons
const STATUS_CONFIG: Record<string, { color: string, icon: any, label: string }> = {
    pending: { color: '#fbbf24', icon: Clock, label: 'Order Placed' },
    confirmed: { color: '#fbbf24', icon: CheckCircle, label: 'Confirmed' },
    packed: { color: '#60a5fa', icon: Package, label: 'Packed' },
    handed_to_rider: { color: '#a855f7', icon: Truck, label: 'Handed to Rider' },
    at_warehouse: { color: '#a855f7', icon: Warehouse, label: 'At Warehouse' },
    out_for_delivery: { color: '#ec4899', icon: Truck, label: 'Out for Delivery' },
    delivered: { color: '#22c55e', icon: CheckCircle, label: 'Delivered' },
    cancelled: { color: '#ef4444', icon: CheckCircle, label: 'Cancelled' },
};

const Polyline: React.FC<{ points: { lat: number, lng: number }[], color: string, dashed?: boolean }> = ({ points, color, dashed }) => {
    const map = useMap();
    const polylineRef = useRef<google.maps.Polyline | null>(null);

    useEffect(() => {
        if (!map || !points.length) return;

        polylineRef.current = new google.maps.Polyline({
            path: points,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: 1.0,
            strokeWeight: 4,
            map: map,
            icons: dashed ? [{
                icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 },
                offset: '0',
                repeat: '20px'
            }] : []
        });

        if (dashed) {
            polylineRef.current.setOptions({ strokeOpacity: 0 });
        }

        return () => {
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
            }
        };
    }, [map, points, color, dashed]);

    return null;
};

const InteractiveTrackingPage: React.FC = () => {
    const { token, orderId } = useParams<{ token?: string, orderId?: string }>();
    const [searchParams] = useSearchParams();
    const [tracking, setTracking] = useState<OrderTracking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTimeline, setShowTimeline] = useState(false);
    const [progress, setProgress] = useState(0);

    const isPublic = !!token;

    // Fetch tracking data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const response = isPublic 
                    ? await GuestCommerce.getPublicTracking(token!)
                    : await Commerce.getOrderTracking(orderId!);

                if (response.ok) {
                    setTracking(response.body);
                    if (response.body.current_status === 'delivered') {
                        confetti({
                            particleCount: 150,
                            spread: 70,
                            origin: { y: 0.6 },
                            colors: ['#ec4899', '#a855f7', '#60a5fa']
                        });
                    }
                } else {
                    setError('Tracking information not found');
                }
            } catch (err) {
                setError('Failed to load tracking data');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, [token, orderId, isPublic]);

    // Decode polyline and calculate parcel position
    const path = useMemo(() => {
        if (!tracking?.polyline) return [];
        return decodePolyline(tracking.polyline);
    }, [tracking?.polyline]);

    // Simulate movement
    useEffect(() => {
        if (!tracking || path.length === 0) return;

        // In a real app, we'd calculate progress based on segment_started_at
        // For now, we'll set it based on status
        let targetProgress = 0;
        switch (tracking.current_status) {
            case 'pending':
            case 'confirmed':
            case 'packed': targetProgress = 0; break;
            case 'handed_to_rider': targetProgress = 0.3; break;
            case 'at_warehouse': targetProgress = 0.6; break;
            case 'out_for_delivery': targetProgress = 0.85; break;
            case 'delivered': targetProgress = 1.0; break;
            default: targetProgress = 0;
        }

        const duration = 2000;
        const start = performance.now();
        const initialProgress = progress;

        const animate = (now: number) => {
            const elapsed = now - start;
            const p = Math.min(1, elapsed / duration);
            const currentP = initialProgress + (targetProgress - initialProgress) * p;
            setProgress(currentP);

            if (p < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [tracking?.current_status, path]);

    const parcelPos = useMemo(() => interpolateAlong(path, progress), [path, progress]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#050505]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (error || !tracking) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505] p-4 text-center">
                <div className="mb-6 rounded-full bg-red-500/10 p-4 text-red-500">
                    <Package size={48} />
                </div>
                <h1 className="mb-2 text-2xl font-black uppercase tracking-tight">Tracking Not Found</h1>
                <p className="mb-8 text-white/60">We couldn't find any tracking information for this link.</p>
                <Link to="/" className="rounded-full bg-white px-8 py-3 text-sm font-bold text-black">
                    Back to Home
                </Link>
            </div>
        );
    }

    const currentStatusConfig = STATUS_CONFIG[tracking.current_status] || STATUS_CONFIG.pending;
    const StatusIcon = currentStatusConfig.icon;

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
            <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                    defaultCenter={tracking.anchors.customer}
                    defaultZoom={12}
                    mapId={MAP_ID}
                    disableDefaultUI={true}
                    className="h-full w-full"
                >
                    {/* Polylines */}
                    {path.length > 0 && (
                        <>
                            <Polyline points={path.slice(0, Math.floor(path.length * progress) + 1)} color="#ec4899" />
                            <Polyline points={path.slice(Math.floor(path.length * progress))} color="#ffffff40" dashed />
                        </>
                    )}

                    {/* Anchors */}
                    <AdvancedMarker position={tracking.anchors.seller}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black shadow-xl">
                            <Store size={20} className="text-white" />
                        </div>
                    </AdvancedMarker>

                    {tracking.anchors.warehouse && (
                        <AdvancedMarker position={tracking.anchors.warehouse}>
                            <div className="relative">
                                {tracking.current_status === 'at_warehouse' && (
                                    <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-white/20" />
                                )}
                                <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black shadow-xl">
                                    <Warehouse size={20} className="text-white" />
                                </div>
                            </div>
                        </AdvancedMarker>
                    )}

                    <AdvancedMarker position={tracking.anchors.customer}>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-primary shadow-xl">
                            <Home size={20} className="text-white" />
                        </div>
                    </AdvancedMarker>

                    {/* Parcel Marker */}
                    {parcelPos.lat !== 0 && tracking.current_status !== 'delivered' && tracking.current_status !== 'pending' && (
                        <AdvancedMarker position={parcelPos}>
                            <div className="relative">
                                <div className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-primary/30" />
                                <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-2xl ring-2 ring-white">
                                    <Truck size={16} className="text-white" />
                                </div>
                            </div>
                        </AdvancedMarker>
                    )}
                </Map>
            </APIProvider>

            {/* Header Overlay */}
            <div className="absolute left-0 right-0 top-0 p-4">
                <div className="flex items-center justify-between gap-4">
                    <Link to={isPublic ? "/" : "/track"} className="flex h-12 w-12 items-center justify-center rounded-full bg-black/80 backdrop-blur-md">
                        <ArrowLeft size={20} />
                    </Link>
                    
                    <div className="flex-1 rounded-full bg-black/80 px-6 py-3 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Current Status</p>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 animate-pulse rounded-full" style={{ backgroundColor: currentStatusConfig.color }} />
                                    <p className="text-sm font-black uppercase tracking-tight">{currentStatusConfig.label}</p>
                                </div>
                            </div>
                            {tracking.estimated_delivery && (
                                <div className="text-right">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">ETA</p>
                                    <p className="text-sm font-black uppercase tracking-tight">
                                        {new Date(tracking.estimated_delivery).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button className="flex h-12 w-12 items-center justify-center rounded-full bg-black/80 backdrop-blur-md">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            {/* Bottom Card */}
            <motion.div 
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                onDragEnd={(_, info) => {
                    if (info.offset.y < -50) setShowTimeline(true);
                    if (info.offset.y > 50) setShowTimeline(false);
                }}
                className="absolute bottom-0 left-0 right-0 z-50 rounded-t-[2.5rem] bg-black/90 p-6 shadow-2xl backdrop-blur-xl"
                initial={{ y: '60%' }}
                animate={{ y: showTimeline ? '0%' : '60%' }}
                transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            >
                <div 
                    className="mx-auto mb-6 h-1.5 w-12 rounded-full bg-white/20" 
                    onClick={() => setShowTimeline(!showTimeline)}
                />

                <div className="mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight">Order Timeline</h2>
                    <p className="text-sm text-white/50">Track every step of your parcel</p>
                </div>

                <div className="max-h-[50vh] space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                    {tracking.timeline.map((milestone, i) => {
                        const config = STATUS_CONFIG[milestone.status] || STATUS_CONFIG.pending;
                        const Icon = config.icon;
                        const isLast = i === tracking.timeline.length - 1;

                        return (
                            <div key={i} className="relative flex gap-4">
                                {!isLast && (
                                    <div className="absolute left-[15px] top-8 h-full w-[2px] bg-white/10" />
                                )}
                                <div 
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10"
                                    style={i === 0 ? { backgroundColor: config.color + '20', ringColor: config.color } : {}}
                                >
                                    <Icon size={14} className={i === 0 ? "" : "text-white/40"} style={i === 0 ? { color: config.color } : {}} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className={`text-sm font-bold uppercase tracking-tight ${i === 0 ? "text-white" : "text-white/60"}`}>
                                            {milestone.label}
                                        </h3>
                                        <span className="text-[10px] font-medium text-white/40">
                                            {new Date(milestone.occurred_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {milestone.note && (
                                        <p className="mt-1 text-xs text-white/40 leading-relaxed">{milestone.note}</p>
                                    )}
                                    {milestone.location?.city && (
                                        <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-white/30">
                                            <MapPin size={10} />
                                            {milestone.location.city}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default InteractiveTrackingPage;
