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

    export async function Login(email: string, password: string): Promise<APIResponse<any>> {
        const device_info = await getDeviceInfo();
        return request("/seller/auth/login", "POST", { email, password, device_info }, undefined, true);
    }

    export async function GetProfile(token: string): Promise<APIResponse<TSeller>> {
        return request("/seller/profile", "GET", undefined, token);
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
