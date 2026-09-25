import fs from "node:fs";
import { API_BASE_URL, WWW_BASE_URL } from "../config";
import type {
    Sport,
    StoredCredentials,
    TourDetail,
    TourListResponse,
    TourStatus,
    TourSummary,
    TourType,
    UploadDataType,
    UserProfile
} from "../types";
import { apiFetch, apiJson } from "./client";

export interface ListToursParams {
    type?: TourType;
    status?: "public";
    sportTypes?: string;
    name?: string;
    startDate?: string;
    endDate?: string;
    sortField?: string;
    sortDirection?: string;
    limit?: number;
    page?: number;
}

export function listTours(
    userId: string,
    params: ListToursParams,
    auth?: StoredCredentials
): Promise<TourListResponse> {
    return apiJson<TourListResponse>(
        `${API_BASE_URL}/v007/users/${encodeURIComponent(userId)}/tours/`,
        {
            auth,
            query: {
                type: params.type,
                status: params.status,
                sport_types: params.sportTypes,
                name: params.name,
                start_date: params.startDate,
                end_date: params.endDate,
                sort_field: params.sortField,
                sort_direction: params.sortDirection,
                limit: params.limit,
                page: params.page
            }
        }
    );
}

const FETCH_ALL_PAGE_SIZE = 500;

// The API cannot sort by id, so fetch every page, sort locally, and slice
// out the requested page so pagination stays consistent across pages.
export async function listToursSortedById(
    userId: string,
    params: ListToursParams,
    auth?: StoredCredentials
): Promise<TourListResponse> {
    const baseParams = {
        ...params,
        sortField: undefined,
        sortDirection: undefined,
        limit: FETCH_ALL_PAGE_SIZE
    };
    const tours: TourSummary[] = [];
    for (let page = 0; ; page++) {
        const result = await listTours(userId, { ...baseParams, page }, auth);
        tours.push(...(result._embedded?.tours ?? []));
        if (!result.page || page + 1 >= result.page.totalPages) {
            break;
        }
    }

    const sign = params.sortDirection === "desc" ? -1 : 1;
    tours.sort((a, b) => sign * (a.id - b.id));

    const limit = params.limit ?? 25;
    const page = params.page ?? 0;
    return {
        _embedded: { tours: tours.slice(page * limit, (page + 1) * limit) },
        page: {
            number: page,
            totalPages: Math.max(1, Math.ceil(tours.length / limit)),
            totalElements: tours.length
        }
    };
}

export function getTour(
    tourId: string,
    auth?: StoredCredentials
): Promise<TourDetail> {
    return apiJson<TourDetail>(
        `${API_BASE_URL}/v007/tours/${encodeURIComponent(tourId)}`,
        {
            auth,
            query: { _embedded: "coordinates,way_types,surfaces,directions" }
        }
    );
}

export async function downloadGpx(
    tourId: string,
    auth?: StoredCredentials
): Promise<string> {
    const response = await apiFetch(
        `${API_BASE_URL}/v007/tours/${encodeURIComponent(tourId)}.gpx`,
        { auth }
    );
    return response.text();
}

export async function downloadFit(
    tourId: string,
    auth?: StoredCredentials
): Promise<Buffer> {
    const response = await apiFetch(
        `${API_BASE_URL}/v007/tours/${encodeURIComponent(tourId)}.fit`,
        { auth }
    );
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

export interface EditTourPatch {
    name?: string;
    sport?: Sport;
    status?: TourStatus;
}

export async function editTour(
    tourId: string,
    patch: EditTourPatch,
    auth: StoredCredentials
): Promise<TourDetail> {
    const response = await apiFetch(
        `${API_BASE_URL}/v007/tours/${encodeURIComponent(tourId)}`,
        {
            method: "PATCH",
            auth,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch)
        }
    );
    return (await response.json()) as TourDetail;
}

export async function deleteTour(
    tourId: string,
    auth: StoredCredentials
): Promise<void> {
    await apiFetch(`${API_BASE_URL}/v007/tours/${encodeURIComponent(tourId)}`, {
        method: "DELETE",
        auth
    });
}

export interface UploadTourParams {
    dataType: UploadDataType;
    sport?: Sport;
    name?: string;
    timeInMotion?: number;
}

export interface UploadTourResult {
    tour: TourDetail;
    duplicate: boolean;
}

export async function uploadTour(
    filePath: string,
    params: UploadTourParams,
    auth: StoredCredentials
): Promise<UploadTourResult> {
    const fileBuffer = fs.readFileSync(filePath);
    const response = await apiFetch(`${API_BASE_URL}/v007/tours/`, {
        method: "POST",
        auth,
        query: {
            data_type: params.dataType,
            sport: params.sport,
            name: params.name,
            time_in_motion: params.timeInMotion
        },
        // Komoot expects the raw file bytes regardless of format; an XML
        // content type (e.g. application/gpx+xml) makes its server try to
        // parse the body as XML and fail with 400 HttpMessageNotReadable.
        headers: { "Content-Type": "application/octet-stream" },
        body: new Uint8Array(fileBuffer)
    });
    const tour = (await response.json()) as TourDetail;
    return { tour, duplicate: response.status === 202 };
}

export function userExists(email: string): Promise<{ exists: boolean }> {
    return apiJson<{ exists: boolean }>(
        `${WWW_BASE_URL}/api/v007/account/user_exists`,
        {
            query: { email }
        }
    );
}

export function getUserProfile(
    userId: string,
    auth?: StoredCredentials
): Promise<UserProfile> {
    return apiJson<UserProfile>(
        `${API_BASE_URL}/v007/users/${encodeURIComponent(userId)}`,
        { auth }
    );
}
