import polyline from '@mapbox/polyline';

export interface LatLng {
    lat: number;
    lng: number;
}

/**
 * Decodes an encoded polyline string into an array of LatLng points.
 */
export function decodePolyline(encoded: string): LatLng[] {
    if (!encoded) return [];
    const points = polyline.decode(encoded);
    return points.map(([lat, lng]) => ({ lat, lng }));
}

/**
 * Calculates the total distance of a path.
 */
function getPathDistance(points: LatLng[]): number {
    let distance = 0;
    for (let i = 0; i < points.length - 1; i++) {
        distance += Math.sqrt(
            Math.pow(points[i + 1].lat - points[i].lat, 2) +
            Math.pow(points[i + 1].lng - points[i].lng, 2)
        );
    }
    return distance;
}

/**
 * Interpolates a position along a path based on progress (0 to 1).
 */
export function interpolateAlong(points: LatLng[], progress: number): LatLng {
    if (points.length === 0) return { lat: 0, lng: 0 };
    if (points.length === 1) return points[0];
    if (progress <= 0) return points[0];
    if (progress >= 1) return points[points.length - 1];

    const totalDistance = getPathDistance(points);
    const targetDistance = totalDistance * progress;
    
    let currentDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const segmentDistance = Math.sqrt(
            Math.pow(p2.lat - p1.lat, 2) +
            Math.pow(p2.lng - p1.lng, 2)
        );

        if (currentDistance + segmentDistance >= targetDistance) {
            const segmentProgress = (targetDistance - currentDistance) / segmentDistance;
            return {
                lat: p1.lat + (p2.lat - p1.lat) * segmentProgress,
                lng: p1.lng + (p2.lng - p1.lng) * segmentProgress,
            };
        }
        currentDistance += segmentDistance;
    }

    return points[points.length - 1];
}

/**
 * Estimates progress based on start time and expected duration.
 * Progress is capped at 0.95 until confirmed.
 */
export function estimateProgress(startedAt: Date, expectedDurationMinutes: number): number {
    const now = new Date();
    const elapsed = now.getTime() - startedAt.getTime();
    const expected = expectedDurationMinutes * 60 * 1000;
    
    if (expected <= 0) return 0;
    
    const rawProgress = elapsed / expected;
    return Math.min(0.95, rawProgress);
}
