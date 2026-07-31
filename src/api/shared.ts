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

export interface UploadedFile {
    url: string;
    object: string;
}

export async function uploadFile(
    file: File,
    compressionOptions?: CompressionOptions | keyof typeof COMPRESSION_PRESETS,
    url: string = API_BASE_URL + '/files/upload',
): Promise<UploadedFile> {
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
        const message = err.error?.message || err.data?.error?.message || err.error || err.data?.error;
        throw new Error(typeof message === 'string' ? message : `HTTP error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const uploaded = result.data?.file || result.file;
    if (result.success && uploaded?.url && uploaded?.object) return { url: uploaded.url, object: uploaded.object };
    throw new Error('Invalid response format or missing file URL/object');
}

export async function uploadFileAndGetUrl(
    file: File,
    compressionOptions?: CompressionOptions | keyof typeof COMPRESSION_PRESETS,
    url?: string,
): Promise<string> {
    return (await uploadFile(file, compressionOptions, url)).url;
}

export async function uploadImagesAndGetUrls(files: FileList | File[]): Promise<string[]> {
    const images = Array.from(files);
    if (!images.length) throw new Error('No images provided');
    if (images.length > 10) throw new Error('Upload up to 10 images at a time');

    const formData = new FormData();
    const processedImages = await Promise.all(images.map((file) => compressImage(file, 'high_quality')));
    processedImages.forEach((file) => formData.append('images', file, file.name));

    const response = await fetch(`${API_BASE_URL}/files/upload/images`, { method: 'POST', body: formData });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const message = err.error?.message || err.data?.error?.message || err.error || err.data?.error;
        throw new Error(typeof message === 'string' ? message : `HTTP error ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const uploaded = result.data?.files || result.files || [];
    const urls = uploaded.map((file: any) => file?.url).filter(Boolean);
    if (urls.length !== images.length) throw new Error('Invalid response format or missing image URLs');
    return urls;
}

export interface PrivateFileUploadOptions {
    folder?: 'products' | 'avatars' | 'documents' | 'kyc' | 'orders';
    allowedTypes?: readonly string[];
    maxBytes?: number;
    metadata?: Record<string, unknown>;
    contentType?: string;
}

/** Fetch a protected image as a temporary browser URL for inline rendering. */
export async function getPrivateImageUrl(path: string, token?: string): Promise<string> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!response.ok) throw new Error('Could not load packing photo');
    return URL.createObjectURL(await response.blob());
}

/** Upload evidence without ever persisting a temporary download URL. */
export async function uploadPrivateFile(
    file: File,
    options: PrivateFileUploadOptions = {},
    token?: string,
): Promise<string> {
    if (!file) throw new Error('No file provided');
    const contentType = options.contentType || file.type || 'application/octet-stream';
    if (options.allowedTypes?.length && !options.allowedTypes.includes(contentType)) {
        throw new Error('This file type is not allowed');
    }
    if (options.maxBytes && file.size > options.maxBytes) {
        throw new Error(`File must be smaller than ${Math.floor(options.maxBytes / 1024 / 1024)} MB`);
    }

    // Media docs: private evidence must be uploaded through multipart /files/upload with the
    // owner's bearer token so the server records the uploader, then submitted as `file.object`.
    const formData = new FormData();
    formData.append('file', file, file.name);
    formData.append('visibility', 'private');

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
    });

    const result = await response.json().catch(() => ({} as any));
    if (!response.ok) {
        const message = result?.error?.message || result?.data?.error?.message || result?.message;
        throw new Error(typeof message === 'string' ? message : 'Could not upload private file');
    }

    const uploaded = result.data?.file || result.file;
    if (!uploaded?.object) throw new Error('Private upload response is missing the stored object name');
    return uploaded.object as string;
}
