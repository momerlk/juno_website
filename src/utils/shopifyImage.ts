const isShopifyImage = (url: string) =>
    typeof url === 'string' &&
    (url.includes('cdn.shopify.com') || url.includes('shopify.com/s/files/'));

type ImageAwareNavigator = Navigator & {
    deviceMemory?: number;
    connection?: {
        downlink?: number;
        effectiveType?: string;
        saveData?: boolean;
    };
};

const getThumbnailWidthCeiling = () => {
    if (typeof navigator === 'undefined') return Infinity;

    const { connection, deviceMemory } = navigator as ImageAwareNavigator;
    if (connection?.saveData || ['slow-2g', '2g'].includes(connection?.effectiveType ?? '')) return 240;
    if ((deviceMemory ?? Infinity) <= 2 || connection?.effectiveType === '3g' || (connection?.downlink ?? Infinity) < 1.5) return 360;
    return Infinity;
};

export const getShopifySizedImage = (url: string, width: number): string => {
    if (!url || !isShopifyImage(url) || width <= 0) return url;

    try {
        const parts = url.split('?');
        const path = parts[0];
        const query = parts[1] ? `?${parts[1]}` : '';
        const lastDotIndex = path.lastIndexOf('.');
        if (lastDotIndex === -1) return url;

        const pathWithoutExt = path.substring(0, lastDotIndex);
        const ext = path.substring(lastDotIndex);

        return `${pathWithoutExt}_${width}x${ext}${query}`;
    } catch {
        return url;
    }
};

export const getResponsiveShopifyImageSet = (url: string, widths: number[]) => {
    if (!url) return { src: url, srcSet: undefined as string | undefined };
    if (!isShopifyImage(url)) return { src: url, srcSet: undefined as string | undefined };

    const validWidths = widths.filter((width) => width > 0);
    const widthCeiling = getThumbnailWidthCeiling();
    const uniqueWidths = Array.from(new Set(validWidths.filter((width) => width <= widthCeiling))).sort((a, b) => a - b);
    if (uniqueWidths.length === 0 && validWidths.length > 0) uniqueWidths.push(Math.min(...validWidths));
    if (uniqueWidths.length === 0) return { src: url, srcSet: undefined as string | undefined };

    return {
        src: getShopifySizedImage(url, uniqueWidths[Math.min(1, uniqueWidths.length - 1)]),
        srcSet: uniqueWidths.map((width) => `${getShopifySizedImage(url, width)} ${width}w`).join(', '),
    };
};
