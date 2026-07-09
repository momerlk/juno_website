const isShopifyImage = (url: string) =>
    typeof url === 'string' &&
    (url.includes('cdn.shopify.com') || url.includes('shopify.com/s/files/'));

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

    const uniqueWidths = Array.from(new Set(widths.filter((width) => width > 0))).sort((a, b) => a - b);
    if (uniqueWidths.length === 0) return { src: url, srcSet: undefined as string | undefined };

    return {
        src: getShopifySizedImage(url, uniqueWidths[Math.min(1, uniqueWidths.length - 1)]),
        srcSet: uniqueWidths.map((width) => `${getShopifySizedImage(url, width)} ${width}w`).join(', '),
    };
};
