import { Inventory, Product } from "../constants/types";
import { Address } from "../constants/address";
import { NestedOrderMap, Order } from "../constants/orders";
import { Seller as TSeller } from "../constants/seller";
import { UserResponse } from "../components/app_onboarding/user";
import { request, API_BASE_URL, APIResponse } from "./core";
import { getDeviceInfo, uploadFileAndGetUrl, COMPRESSION_PRESETS, CompressionOptions } from "./shared";

export { uploadFileAndGetUrl, COMPRESSION_PRESETS };
export type { CompressionOptions, APIResponse };

export const api_url = API_BASE_URL;

export function setState(data: any) {
    if (data && data.token) {
        localStorage.setItem('token', data.token);
    }
}

const getToken = () => localStorage.getItem('token') ?? undefined;

export namespace OTP {
    export async function Send(phone_number: string): Promise<APIResponse<any>> {
        return request("/auth/send-otp", "POST", { phone_number }, undefined, true);
    }

    export async function Verify(phone_number: string, otp: string): Promise<APIResponse<any>> {
        return request("/auth/verify", "POST", { phone_number, otp }, undefined, true);
    }
}

export namespace Auth {
    export async function Register(data: UserResponse): Promise<APIResponse<any>> {
        return request("/auth/register", "POST", data, undefined, true);
    }

    export async function Login(phone_number: string, password: string): Promise<APIResponse<any>> {
        const device_info = await getDeviceInfo();
        return request("/auth/login", "POST", { phone_number, password, device_info }, undefined, true);
    }

    export async function GetProfile(token: string): Promise<APIResponse<TSeller>> {
        return request("/me", "GET", undefined, token);
    }

    export async function ChangePassword(token: string, old_password: string, new_password: string): Promise<APIResponse<any>> {
        return request("/auth/change-password", "POST", { old_password, new_password }, token);
    }

    export async function Refresh(refresh_token: string): Promise<APIResponse<any>> {
        return request("/auth/refresh", "POST", { refresh_token }, undefined, true);
    }

    export async function RequestPasswordReset(phone_number: string): Promise<APIResponse<any>> {
        return request("/auth/reset-password/request", "POST", { phone_number }, undefined, true);
    }

    export async function ResetPassword(token: string, new_password: string): Promise<APIResponse<any>> {
        return request("/auth/reset-password", "POST", { token, new_password }, undefined, true);
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
        return request("/invites/all", "GET", undefined, undefined, true);
    }

    export async function GenerateInvite(owner: string): Promise<APIResponse<Invite>> {
        return request(`/invites/generate?owner=${owner}`, "POST", undefined, undefined, true);
    }

    export async function IncrementInvite(code: string, user_id: string): Promise<APIResponse<Invite>> {
        return request(`/invites/increment?code=${code}&user_id=${user_id}`, "POST", undefined, undefined, true);
    }

    export async function GetInviteByCode(code: string): Promise<APIResponse<Invite>> {
        return request(`/invites/by-code?code=${code}`, "GET", undefined, undefined, true);
    }
}

export namespace Waitlist {
    export async function Join(data: { phone_number?: string; email?: string; name?: string }): Promise<APIResponse<any>> {
        return request("/waitlist", "POST", data, undefined, true);
    }
    export async function GetSpots(): Promise<APIResponse<any>> {
        return request("/waitlist/spots", "GET", undefined, undefined, true);
    }
    export async function GetStatus(phone_number: string): Promise<APIResponse<any>> {
        return request(`/waitlist/status?phone_number=${encodeURIComponent(phone_number)}`, "GET", undefined, undefined, true);
    }
}

export namespace Social {
    export namespace Polls {
        export async function GetActive(): Promise<APIResponse<any>> {
            return request("/social/polls/active", "GET", undefined, undefined, true);
        }
        export async function Vote(token: string, poll_id: string, option_id: string): Promise<APIResponse<any>> {
            return request(`/social/polls/${poll_id}/vote`, "POST", { option_id }, token);
        }
    }

    export namespace Reviews {
        export async function CreateAppReview(token: string, data: { rating: number; review?: string }): Promise<APIResponse<any>> {
            return request("/social/reviews/app", "POST", data, token);
        }
        export async function GetFeaturedAppReviews(): Promise<APIResponse<any>> {
            return request("/social/reviews/app/featured", "GET", undefined, undefined, true);
        }
        export async function CreateBrandReview(token: string, data: { seller_id: string; rating: number; review?: string }): Promise<APIResponse<any>> {
            return request("/social/reviews/brand", "POST", data, token);
        }
        export async function GetBrandReviews(seller_id: string): Promise<APIResponse<any>> {
            return request(`/social/reviews/brand/${seller_id}`, "GET", undefined, undefined, true);
        }
    }
}

export async function submitFeedback(token: string, data: { type: string; message: string }): Promise<APIResponse<any>> {
    return request("/feedback", "POST", data, token);
}

export namespace Notifications {
    export async function Register(token: string, expo_token: string): Promise<APIResponse<any>> {
        return request("/notifications/register", "POST", { expo_token }, token);
    }
    export async function Unregister(token: string, expo_token: string): Promise<APIResponse<any>> {
        return request("/notifications/unregister", "POST", { expo_token }, token);
    }
}

export namespace Profile {
    export async function Update(token: string, data: any): Promise<APIResponse<any>> {
        return request("/me", "PATCH", data, token);
    }
    export async function UpdateMeasurements(token: string, measurements: any): Promise<APIResponse<any>> {
        return request("/me/measurements", "PUT", measurements, token);
    }
}

export namespace Logistics {
    export async function GetFareEstimate(data: { origin: string; destination: string; weight?: number }): Promise<APIResponse<any>> {
        return request("/logistics/fare-estimate", "POST", data, undefined, true);
    }
}

export namespace Updates {
    export async function Get(): Promise<APIResponse<any>> {
        return request("/updates", "GET", undefined, undefined, true);
    }
}
