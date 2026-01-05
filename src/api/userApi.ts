import moment from "moment";
import { Inventory, Product } from "../constants/types";
import { Address } from "../constants/address";
import { NestedOrderMap, Order } from "../constants/orders";
import { Seller as TSeller} from "../constants/seller";
import { UserResponse } from "../components/app_onboarding/user";

export function setState(data: any) {
  if (data && data.token) {
    localStorage.setItem('token', data.token);
  }
}

// --- Generic API Response Interface ---
export interface APIResponse<T> {
    status: number;
    ok: boolean;
    body: T;
}

// --- API Configuration ---
const api_urls = {
    testing: "http://192.168.18.96:8080/api/v1",
    production: "https://junoapi-710509977105.asia-south2.run.app/api/v1",
    recsystem : "https://junorecsys-710509977105.asia-south2.run.app",
};

/**
 * The base URL for all API requests.
 */
export const api_url = api_urls.testing;


// --- Reusable Helper Functions (Refactored to top-level) ---

/**
 * Parses the JSON body from a Response object.
 * @param resp The Response object.
 * @returns A promise that resolves to the parsed JSON or an empty object on error.
 */
async function parseBody(resp: Response): Promise<any> {
    try {
        return await resp.json();
    } catch {
        return {};
    }
}

/**
 * Makes an API request with a JSON body.
 * @param url The endpoint URL (e.g., "/users/profile").
 * @param method The HTTP method (e.g., "POST", "PUT").
 * @param token The authorization token.
 * @param data The data to be sent in the request body.
 * @returns A promise that resolves to an APIResponse.
 */
async function requestWithBody(url: string, method: string, token: string, data: any): Promise<APIResponse<any>> {
    const headers = new Headers({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    });

    let resp = await fetch(`${api_url}${url}`, {
        method,
        headers,
        body: JSON.stringify(data)
    });

    // token needs to be refreshed
    if (resp.status === 401 && token.length > 0){
      const refreshResponse = await fetch(`${api_url}/auth/refresh`, {
        method : "POST",
        body: JSON.stringify({
          "refresh_token" : token,
        })
      });
      if (!refreshResponse.ok){
        return {
          status : refreshResponse.status,
          ok : false,
          body : {message : "Login Token Expired"},
        }
      } else {
        const body = await parseBody(refreshResponse);
        setState({
          token : body.token,
        })
        const headers = new Headers({
          "Authorization": `Bearer ${body.token}`
        });
        resp = await fetch(`${api_url}${url}`, {
            method,
            headers,
            body : JSON.stringify(data),
        });
      }
    }

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}


/**
 * Makes an API request with a JSON body.
 * @param url The endpoint URL (e.g., "/users/profile").
 * @param method The HTTP method (e.g., "POST", "PUT").
 * @param token The authorization token.
 * @param data The data to be sent in the request body.
 * @returns A promise that resolves to an APIResponse.
 */
async function publicRequestWithBody(url: string, method: string, data: any): Promise<APIResponse<any>> {
    const headers = new Headers({
        "Content-Type": "application/json",
    });

    let resp = await fetch(`${api_url}${url}`, {
        method,
        headers,
        body: JSON.stringify(data)
    });

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}

/**
 * Makes an API request without a body.
 * @param url The endpoint URL, including any query parameters.
 * @param method The HTTP method (e.g., "GET", "DELETE").
 * @param token The authorization token.
 * @returns A promise that resolves to an APIResponse.
 */
async function requestWithoutBody(url: string, method: string, token: string): Promise<APIResponse<any>> {
    const headers = new Headers({
        "Authorization": `Bearer ${token}`
    });

    let resp = await fetch(`${api_url}${url}`, {
        method,
        headers
    });

    // token needs to be refreshed
    if (resp.status === 401 && token.length > 0){
      const refreshResponse = await fetch(`${api_url}/auth/refresh`, {
        method : "POST",
        body: JSON.stringify({
          refresh_token : token,
        })
      });
      if (!refreshResponse.ok){
        return {
          status : refreshResponse.status,
          ok : false,
          body : {message : "Login Token Expired"},
        }
      } else {
        const body = await parseBody(refreshResponse);
        setState({
          token : body.token,
        })
        const headers = new Headers({
          "Authorization": `Bearer ${body.token}`
        });
        resp = await fetch(`${api_url}${url}`, {
            method,
            headers,
        });
      }
    }

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}

// New helper for public endpoints that do not require an Authorization header.
async function publicRequestWithoutBody(url: string, method: string): Promise<APIResponse<any>> {
    const resp = await fetch(`${api_url}${url}`, {
        method
    });

    const body = await parseBody(resp);
    return {
        status: resp.status,
        ok: resp.ok,
        body: resp.ok ? body : body.error
    };
}



export namespace OTP {
    export async function Send(phone_number : string) : Promise<APIResponse<any>> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "phone_number": phone_number,
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
        };

        const resp = await fetch(api_url + "/auth/send-otp", requestOptions)

        const body = await resp.json();
        if (!resp.ok){
            return {
                status : resp.status,
                ok : false,
                body : body.error
            }
        }

        return {
            status : resp.status,
            ok : true,
            body : body
        };
    }

    export async function Verify(phone_number : string, otp : string) : Promise<APIResponse<any>> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "otp": otp,
            "phone_number": phone_number
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
        };

        const resp = await fetch(api_url + "/auth/verify", requestOptions)

        const body = await resp.json();
        if (!resp.ok){
            return {
                status : resp.status,
                ok : false,
                body : body.error
            }
        }

        return {
            status : resp.status,
            ok : true,
            body : body
        };
    }
}

export namespace Auth {
    const getDeviceInfo = async (): Promise<{
        app_version: string;
        device_id: string;
        device_name: string;
        device_type: string;
        last_used: string;
        os_version: string;
        user_agent: string;
    }> => {
        const app_version = "1.0.0"; // Placeholder for web app version
        // Generate or retrieve a unique ID from local storage
        let device_id = localStorage.getItem('device_id');
        if (!device_id) {
            device_id = crypto.randomUUID();
            localStorage.setItem('device_id', device_id);
        }
        
        const device_name = "Web Browser";
        const device_type = "web";
        
        // Attempt to parse OS from user agent
        const ua = navigator.userAgent;
        let os_version = "unknown";
        if (/Windows NT 10.0/.test(ua)) os_version = "Windows 10/11";
        else if (/Windows NT 6.2/.test(ua)) os_version = "Windows 8";
        else if (/Mac OS X 10_15_7/.test(ua)) os_version = "macOS Catalina";
        else if (/Mac OS X/.test(ua)) os_version = "macOS";
        else if (/Android/.test(ua)) os_version = "Android";
        else if (/Linux/.test(ua)) os_version = "Linux";
        else if (/iPhone|iPad|iPod/.test(ua)) os_version = "iOS";

        const user_agent = navigator.userAgent;
        const last_used = moment().toISOString();

        return {
            app_version,
            device_id,
            device_name,
            device_type,
            last_used,
            os_version,
            user_agent,
        };
    };

    export async function Register(data : UserResponse): Promise<APIResponse<any>> {
        return publicRequestWithBody("/auth/register", "POST", data);
    }

    export async function Login(email : string, password : string) : Promise<APIResponse<any>> {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const device_info = await getDeviceInfo();

        const raw = JSON.stringify({
            "password": password,
            "email": email,
            "device_info" : device_info
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
        };

        const resp = await fetch(api_url + "/seller/auth/login", requestOptions)

        const body = await resp.json();
        if (!resp.ok){
            return {
                status : resp.status,
                ok : false,
                body : body.error
            }
        }

        return {
            status : resp.status,
            ok : true,
            body : body
        };
    }

    export async function GetProfile(token : string) : Promise<APIResponse<TSeller>> {
        return await requestWithoutBody("/seller/profile", "GET", token);
    }
    
}

export namespace Invites {
  export interface Invite {
    code: string;
    owner: string;
    signups: number;
    users: string[];
  }
  export async function GetAllInvites(): Promise<APIResponse<Invite[]>> {
    return await publicRequestWithoutBody("/invites/all", "GET");
  }

  export async function GenerateInvite(owner: string): Promise<APIResponse<Invite>> {
    return await publicRequestWithoutBody(`/invites/generate?owner=${owner}`, "POST");
  }

  export async function IncrementInvite(code: string, user_id: string): Promise<APIResponse<Invite>> {
    return await publicRequestWithoutBody(`/invites/increment?code=${code}&user_id=${user_id}`, "POST");
  }

  export async function GetInviteByCode(code: string): Promise<APIResponse<Invite>> {
    return await publicRequestWithoutBody(`/invites/by-code?code=${code}`, "GET");
  }

}



// --- Products Namespace (Newly Implemented) ---

// --- Orders Namespace (Newly Implemented) ---

/*
 * ===========================================================================
 * Cart Namespace
 * ===========================================================================
 */


/*
 * ===========================================================================
 * Addresses Namespace
 * ===========================================================================
 */

/*
 * ===========================================================================
 * Outfits Namespace
 * ===========================================================================
 */

// Interfaces for Outfit request bodies to ensure type safety


/*
 * ===========================================================================
 * Tournaments Namespace
 * ===========================================================================
*/





// Compression options interface
interface CompressionOptions {
  compress?: number; // 0.1 to 1.0 (0.1 = highest compression, 1.0 = no compression)
  resize?: {
    width?: number;
    height?: number;
  };
}

// Default compression settings for different use cases
export const COMPRESSION_PRESETS = {
  thumbnail: { compress: 0.3, resize: { width: 300 } },
  profile: { compress: 0.6, resize: { width: 800 } },
  high_quality: { compress: 0.8, resize: { width: 1200 } },
  ultra_fast: { compress: 0.2, resize: { width: 400 } }
};

// Image compression function for web using canvas
async function compressImage(
  file: File,
  options?: CompressionOptions | keyof typeof COMPRESSION_PRESETS
): Promise<File> {
  return new Promise((resolve, reject) => {
    let compressionSettings: CompressionOptions;

    // Handle preset or custom options
    if (typeof options === 'string' && COMPRESSION_PRESETS[options]) {
      compressionSettings = COMPRESSION_PRESETS[options];
    } else if (typeof options === 'object' && options !== null) {
      compressionSettings = options;
    } else {
      // Default compression for fast upload
      compressionSettings = COMPRESSION_PRESETS.ultra_fast;
    }

    const image = new Image();
    image.src = URL.createObjectURL(file);
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return reject(new Error('Failed to get canvas context'));
      }

      let { width, height } = image;

      // Resize logic
      if (compressionSettings.resize) {
        if (compressionSettings.resize.width && compressionSettings.resize.height) {
            width = compressionSettings.resize.width;
            height = compressionSettings.resize.height;
        } else if (compressionSettings.resize.width) {
          const ratio = width / height;
          width = compressionSettings.resize.width;
          height = width / ratio;
        } else if (compressionSettings.resize.height) {
          const ratio = width / height;
          height = compressionSettings.resize.height;
          width = height * ratio;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = compressionSettings.compress || 0.3;

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newFile = new File([blob], file.name, { type: mimeType });
            resolve(newFile);
          } else {
            reject(new Error('Canvas to Blob conversion failed'));
          }
        },
        mimeType,
        quality
      );
    };
    image.onerror = (error) => {
      console.error('Image loading failed:', error);
      // Return original file if compression fails
      resolve(file);
    };
  });
}

// Main function with compression
export async function uploadFileAndGetUrl(
  file: File,
  compressionOptions?: CompressionOptions | keyof typeof COMPRESSION_PRESETS,
  url: string = api_url + '/files/upload',
): Promise<string> {
  if (!file) {
    throw new Error('No file provided');
  }

  console.log(`Processing file: ${file.name}`);

  let processedFile = file;

  // Compress image if it's an image file
  if (file.type.startsWith('image/')) {
    console.log('Compressing image...');
    processedFile = await compressImage(file, compressionOptions);
    console.log(`Image compressed. Original size: ${file.size}, Compressed size: ${processedFile.size}`);
  }

  // Create FormData and append the file
  const formData = new FormData();
  formData.append('file', processedFile, processedFile.name);

  try {
    // Send the request
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        // 'Content-Type': 'multipart/form-data' is set by the browser automatically
      },
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      } catch (err) {
        if (err instanceof SyntaxError) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        throw err;
      }
    }

    const data = await response.json();

    if (data.success && data.file && data.file.url) {
      console.log('File uploaded successfully:', data.file.url);
      return data.file.url;
    } else {
      throw new Error('Invalid response format or missing URL');
    }
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}