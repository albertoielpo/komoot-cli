// Imported explicitly (rather than relying on Node's ambient global fetch)
// so tests can mock it reliably via undici's MockAgent: Node's global fetch
// and a separately-required 'undici' package do not always share the same
// dispatcher instance inside Jest's sandboxed module registry. This is the
// same implementation Node's native fetch uses under the hood, not a
// third-party HTTP client like axios.
import { fetch, type RequestInit, type Response } from "undici";
import { USER_AGENT } from "../config";
import { debugLog } from "../debug";
import type { StoredCredentials } from "../types";

export class ApiError extends Error {
    constructor(
        message: string,
        public readonly status?: number,
        public readonly code?:
            | "UNAUTHORIZED"
            | "FORBIDDEN"
            | "NOT_FOUND"
            | "SERVER_ERROR"
            | "NETWORK_ERROR"
            | "UNKNOWN"
    ) {
        super(message);
        this.name = "ApiError";
    }
}

export interface RequestOptions {
    method?: string;
    query?: Record<string, string | number | boolean | undefined>;
    headers?: Record<string, string>;
    body?: RequestInit["body"];
    auth?: StoredCredentials;
    retries?: number;
}

function buildUrl(url: string, query?: RequestOptions["query"]): string {
    if (!query) return url;
    const usp = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
            usp.set(key, String(value));
        }
    }
    const qs = usp.toString();
    return qs ? `${url}${url.includes("?") ? "&" : "?"}${qs}` : url;
}

function mapError(status: number, body: string): ApiError {
    switch (status) {
        case 401:
            return new ApiError(
                "Not logged in or session expired. Run `komoot-cli login`.",
                status,
                "UNAUTHORIZED"
            );
        case 403:
            return new ApiError(
                "Access denied for this tour (it may be region-locked or not yours to modify).",
                status,
                "FORBIDDEN"
            );
        case 404:
            return new ApiError("Tour or user not found.", status, "NOT_FOUND");
        default:
            if (status >= 500) {
                return new ApiError(
                    `Komoot server error (${status}). Try again later.`,
                    status,
                    "SERVER_ERROR"
                );
            }
            return new ApiError(
                `Request failed with status ${status}: ${body}`,
                status,
                "UNKNOWN"
            );
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch(
    url: string,
    options: RequestOptions = {}
): Promise<Response> {
    const finalUrl = buildUrl(url, options.query);
    const headers: Record<string, string> = {
        "User-Agent": USER_AGENT,
        ...options.headers
    };
    if (options.auth) {
        const basic = Buffer.from(
            `${options.auth.userId}:${options.auth.token}`
        ).toString("base64");
        headers["Authorization"] = `Basic ${basic}`;
    }

    const maxRetries = options.retries ?? 2;
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        debugLog(
            `${options.method ?? "GET"} ${finalUrl} (attempt ${attempt + 1})`
        );
        let response: Response;
        try {
            response = await fetch(finalUrl, {
                method: options.method ?? "GET",
                headers,
                body: options.body
            });
        } catch (err) {
            if (attempt < maxRetries) {
                attempt += 1;
                await sleep(2 ** attempt * 250);
                continue;
            }
            throw new ApiError(
                `Network error contacting Komoot: ${(err as Error).message}`,
                undefined,
                "NETWORK_ERROR"
            );
        }

        debugLog(`-> ${response.status} ${response.statusText}`);

        if (response.ok) {
            return response;
        }

        if (response.status >= 500 && attempt < maxRetries) {
            attempt += 1;
            await sleep(2 ** attempt * 250);
            continue;
        }

        const body = await response.text().catch(() => "");
        throw mapError(response.status, body);
    }
}

export async function apiJson<T>(
    url: string,
    options: RequestOptions = {}
): Promise<T> {
    // Komoot's API rejects a plain "application/json" Accept header with 406;
    // it only serves its HAL+JSON media type.
    const response = await apiFetch(url, {
        ...options,
        headers: { Accept: "application/hal+json", ...options.headers }
    });
    return (await response.json()) as T;
}
