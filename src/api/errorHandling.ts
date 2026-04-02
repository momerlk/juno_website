/**
 * API Error Handling Utilities
 * 
 * Provides error type guards, error code constants, and helper functions
 * for consistent error handling across the application.
 * 
 * @example
 * // Basic error handling
 * const resp = await Catalog.getProduct(id);
 * if (!resp.ok) {
 *     if (isNotFoundError(resp.body)) {
 *         // Handle 404
 *     } else if (isAuthError(resp.body)) {
 *         // Handle 401
 *     }
 * }
 * 
 * @example
 * // Using error codes
 * if (resp.body.code === ErrorCode.VALIDATION_ERROR) {
 *     // Handle validation error
 * }
 */

import type { APIError, APIResponse } from "./core";

/**
 * Standard API error codes
 * 
 * These codes are returned by the backend for programmatic error handling.
 */
export enum ErrorCode {
    // Client errors (4xx)
    INVALID_BODY = "INVALID_BODY",
    BAD_REQUEST = "BAD_REQUEST",
    UNAUTHORIZED = "UNAUTHORIZED",
    FORBIDDEN = "FORBIDDEN",
    NOT_FOUND = "NOT_FOUND",
    CONFLICT = "CONFLICT",
    VALIDATION_ERROR = "VALIDATION_ERROR",
    TOKEN_EXPIRED = "TOKEN_EXPIRED",
    
    // Server errors (5xx)
    INTERNAL_ERROR = "INTERNAL_ERROR",
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
    
    // Generic
    UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * HTTP status code to error code mapping
 */
export const STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
    400: ErrorCode.BAD_REQUEST,
    401: ErrorCode.UNAUTHORIZED,
    403: ErrorCode.FORBIDDEN,
    404: ErrorCode.NOT_FOUND,
    409: ErrorCode.CONFLICT,
    500: ErrorCode.INTERNAL_ERROR,
    503: ErrorCode.SERVICE_UNAVAILABLE,
};

/**
 * Check if a value is an APIError object
 */
export function isAPIError(value: any): value is APIError {
    return value && typeof value === "object" && "message" in value;
}

/**
 * Check if error is a validation error (400)
 */
export function isValidationError(error: APIError | any): boolean {
    return error?.code === ErrorCode.VALIDATION_ERROR || 
           error?.code === ErrorCode.INVALID_BODY ||
           error?.code === ErrorCode.BAD_REQUEST;
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: APIError | any): boolean {
    return error?.code === ErrorCode.UNAUTHORIZED || 
           error?.code === ErrorCode.TOKEN_EXPIRED;
}

/**
 * Check if error is a not found error (404)
 */
export function isNotFoundError(error: APIError | any): boolean {
    return error?.code === ErrorCode.NOT_FOUND;
}

/**
 * Check if error is a conflict error (409)
 */
export function isConflictError(error: APIError | any): boolean {
    return error?.code === ErrorCode.CONFLICT;
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: APIError | any): boolean {
    const code = error?.code;
    return code === ErrorCode.INTERNAL_ERROR || 
           code === ErrorCode.SERVICE_UNAVAILABLE;
}

/**
 * Get a user-friendly error message
 * 
 * Maps technical error messages to user-friendly versions.
 * For unmapped errors, returns a safe generic message to avoid
 * exposing internal implementation details.
 */
export function getUserFriendlyMessage(error: APIError | any): string {
    if (!error?.message) {
        return "An unexpected error occurred. Please try again.";
    }

    // Map common error messages to user-friendly versions
    const messageMap: Record<string, string> = {
        "malformed json": "Invalid request format",
        "missing required fields": "Please fill in all required fields",
        "invalid credentials": "Invalid email or password",
        "already exists": "This item already exists",
        "not found": "Item not found",
        "unauthorized": "Please log in to continue",
        "token expired": "Your session has expired. Please log in again.",
        "forbidden": "You don't have permission to perform this action",
        "network": "Connection error. Please check your internet.",
        "timeout": "Request timed out. Please try again.",
    };

    const lowerMessage = error.message.toLowerCase();
    for (const [key, friendly] of Object.entries(messageMap)) {
        if (lowerMessage.includes(key)) {
            return friendly;
        }
    }

    // Return generic message for unmapped errors to avoid exposing
    // internal details like stack traces or database schema
    if (error.code && error.code !== "UNKNOWN_ERROR") {
        // Show error code for known codes but not raw message
        return `Error: ${formatErrorCode(error.code)}`;
    }

    return "An error occurred. Please try again or contact support.";
}

/**
 * Format error code for display
 */
function formatErrorCode(code: string): string {
    return code
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Get error toast/notification config
 * 
 * Returns appropriate toast type and message for error display.
 */
export function getErrorToastConfig(error: APIError | any): { type: 'error' | 'warning' | 'info'; message: string; duration?: number } {
    if (isAuthError(error)) {
        return {
            type: 'warning',
            message: 'Your session has expired. Please log in again.',
            duration: 5000
        };
    }

    if (isValidationError(error)) {
        return {
            type: 'error',
            message: getUserFriendlyMessage(error),
            duration: 4000
        };
    }

    if (isNotFoundError(error)) {
        return {
            type: 'info',
            message: 'Item not found',
            duration: 3000
        };
    }

    if (isServerError(error)) {
        return {
            type: 'error',
            message: 'A server error occurred. Please try again later.',
            duration: 5000
        };
    }

    return {
        type: 'error',
        message: getUserFriendlyMessage(error),
        duration: 4000
    };
}

/**
 * Handle API response with callback
 * 
 * Convenience function for handling success/error in one call.
 * 
 * @example
 * await handleAPIResponse(
 *     Catalog.getProduct(id),
 *     (data) => setProduct(data),
 *     (error) => showErrorToast(error)
 * );
 */
export async function handleAPIResponse<T>(
    promise: Promise<APIResponse<T>>,
    onSuccess: (data: T) => void | Promise<void>,
    onError?: (error: APIError) => void | Promise<void>
): Promise<void> {
    const resp = await promise;
    
    if (resp.ok && resp.body && !isAPIError(resp.body)) {
        await onSuccess(resp.body as T);
    } else if (onError) {
        await onError(resp.body as APIError);
    }
}

/**
 * Retry failed request with exponential backoff
 * 
 * @param fn - Request function to retry
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @param initialDelay - Initial delay in ms (default: 1000)
 * @param maxDelay - Maximum delay in ms (default: 10000)
 */
export async function retryRequest<T>(
    fn: () => Promise<APIResponse<T>>,
    maxRetries: number = 3,
    initialDelay: number = 1000,
    maxDelay: number = 10000
): Promise<APIResponse<T>> {
    let lastError: APIError | null = null;
    let delay = initialDelay;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const resp = await fn();
        
        if (resp.ok) {
            return resp;
        }

        lastError = resp.body as APIError;

        // Don't retry client errors (except 401 which might be token refresh)
        if (resp.status >= 400 && resp.status < 500 && resp.status !== 401) {
            return resp;
        }

        // Wait before retry (exponential backoff with jitter)
        if (attempt < maxRetries - 1) {
            const jitter = Math.random() * 0.3 * delay;
            await new Promise(resolve => setTimeout(resolve, delay + jitter));
            delay = Math.min(delay * 2, maxDelay);
        }
    }

    return {
        status: lastError ? 500 : 0,
        ok: false,
        body: lastError || { message: "Request failed after retries", code: ErrorCode.UNKNOWN_ERROR }
    };
}

/**
 * Extract error details for form validation
 * 
 * Parses error details into field-specific errors for form display.
 * 
 * @example
 * const fieldErrors = extractFieldErrors(error);
 * // { email: "Email is required", password: "Password too short" }
 */
export function extractFieldErrors(error: APIError | any): Record<string, string> {
    const details = error?.details;
    if (!details) return {};

    // Handle array of errors
    if (Array.isArray(details)) {
        return details.reduce((acc, err) => {
            if (err.field && err.message) {
                acc[err.field] = err.message;
            }
            return acc;
        }, {} as Record<string, string>);
    }

    // Handle object with field errors
    if (typeof details === "object") {
        return Object.entries(details).reduce((acc, [field, message]) => {
            acc[field] = String(message);
            return acc;
        }, {} as Record<string, string>);
    }

    return {};
}
