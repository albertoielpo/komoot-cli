import { fetch } from "undici";
import { API_BASE_URL } from "../config";
import type { StoredCredentials } from "../types";
import { ApiError } from "./client";

interface LoginResponse {
    username: string;
    password: string;
    [key: string]: unknown;
}

/**
 * Exchanges email/password for the long-lived opaque API token Komoot's own
 * clients use. The response's "password" field is that token, not the real
 * password (see plan §2).
 */
export async function login(
    email: string,
    password: string
): Promise<StoredCredentials> {
    const url = `${API_BASE_URL}/v006/account/email/${encodeURIComponent(email)}/`;
    const basic = Buffer.from(`${email}:${password}`).toString("base64");

    const response = await fetch(url, {
        headers: {
            Authorization: `Basic ${basic}`,
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            throw new ApiError(
                "Login failed: invalid email or password.",
                response.status,
                "UNAUTHORIZED"
            );
        }
        throw new ApiError(
            `Login failed with status ${response.status}.`,
            response.status,
            "UNKNOWN"
        );
    }

    const data = (await response.json()) as LoginResponse;
    return {
        userId: data.username,
        email,
        token: data.password
    };
}
