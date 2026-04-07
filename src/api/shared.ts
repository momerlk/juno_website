import { API_BASE_URL } from "./core";

export async function getDeviceInfo() {
    const app_version = "1.0.0";
    let device_id = localStorage.getItem('device_id');
    if (!device_id) {
        device_id = crypto.randomUUID();
        localStorage.setItem('device_id', device_id);
    }
    const ua = navigator.userAgent;
    let os_version = "unknown";
    if (/Windows NT 10.0/.test(ua))       os_version = "Windows 10/11";
    else if (/Windows NT 6.2/.test(ua))   os_version = "Windows 8";
    else if (/Mac OS X 10_15_7/.test(ua)) os_version = "macOS Catalina";
    else if (/Mac OS X/.test(ua))         os_version = "macOS";
    else if (/Android/.test(ua))          os_version = "Android";
    else if (/Linux/.test(ua))            os_version = "Linux";
    else if (/iPhone|iPad|iPod/.test(ua)) os_version = "iOS";
    return {
        app_version,
        device_id,
        device_name: "Web Browser",
        device_type: "web",
        last_used: new Date().toISOString(),
        os_version,
        user_agent: ua,
    };
}

export interface CompressionOptions {
    compress?: number;
    resize?: { width?: number; height?: number };
}

export const COMPRESSION_PRESETS = {
    thumbnail:    { compress: 0.3, resize: { width: 300 } },
    profile:      { compress: 0.6, resize: { width: 800 } },
    high_quality: { compress: 0.8, resize: { width: 1200 } },
    ultra_fast:   { compress: 0.2, resize: { width: 400 } },
} as const;

async function compressImage(
    file: File,
    options?: CompressionOptions | keyof typeof COMPRESSION_PRESETS
): Promise<File> {
    return new Promise((resolve, reject) => {
        let settings: CompressionOptions;
        if (typeof options === 'string' && COMPRESSION_PRESETS[options]) {
            settings = COMPRESSION_PRESETS[options];
        } else if (typeof options === 'object' && options !== null) {
            settings = options;
        } else {
            settings = COMPRESSION_PRESETS.ultra_fast;
        }

        const image = new Image();
        image.src = URL.createObjectURL(file);
        image.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Failed to get canvas context'));

            let { width, height } = image;
            if (settings.resize) {
                const ratio = width / height;
                if (settings.resize.width && settings.resize.height) {
                    width = settings.resize.width;
                    height = settings.resize.height;
                } else if (settings.resize.width) {
                    width = settings.resize.width;
                    height = width / ratio;
                } else if (settings.resize.height) {
                    height = settings.resize.height;
                    width = height * ratio;
                }
            }

            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(image, 0, 0, width, height);

            const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
            canvas.toBlob(
                (blob) => blob
                    ? resolve(new File([blob], file.name, { type: mimeType }))
                    : reject(new Error('Canvas to Blob conversion failed')),
                mimeType,
                settings.compress ?? 0.3
            );
        };
        image.onerror = () => resolve(file);
    });
}

export async function uploadFileAndGetUrl(
    file: File,
    compressionOptions?: CompressionOptions | keyof typeof COMPRESSION_PRESETS,
    url: string = API_BASE_URL + '/files/upload',
): Promise<string> {
    if (!file) throw new Error('No file provided');

    let processedFile = file;
    if (file.type.startsWith('image/')) {
        processedFile = await compressImage(file, compressionOptions);
    }

    const formData = new FormData();
    formData.append('file', processedFile, processedFile.name);

    const response = await fetch(url, { method: 'POST', body: formData });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.data?.error || `HTTP error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    // V2 API format: { success: true, data: { file: { url: "..." }, message: "..." } }
    if (result.success && result.data?.file?.url) return result.data.file.url;
    // Fallback for legacy format: { success: true, file: { url: "..." } }
    if (result.success && result.file?.url) return result.file.url;
    throw new Error('Invalid response format or missing URL');
}
