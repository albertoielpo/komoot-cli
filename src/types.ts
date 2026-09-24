export const ROUTE_PLANNABLE_SPORTS = [
    "hike",
    "mountaineering",
    "racebike",
    "e_racebike",
    "touringbicycle",
    "e_touringbicycle",
    "mtb",
    "e_mtb",
    "mtb_easy",
    "e_mtb_easy",
    "mtb_advanced",
    "e_mtb_advanced",
    "jogging"
] as const;

export const TRACKING_ONLY_SPORTS = [
    "climbing",
    "downhillbike",
    "nordic",
    "nordicwalking",
    "skaten",
    "skialpin",
    "skitour",
    "sled",
    "snowboard",
    "snowshoe",
    "unicycle",
    "citybike",
    "other"
] as const;

export const ALL_SPORTS = [
    ...ROUTE_PLANNABLE_SPORTS,
    ...TRACKING_ONLY_SPORTS
] as const;

export type Sport = (typeof ALL_SPORTS)[number];

export const TOUR_STATUSES = ["public", "private", "friends"] as const;
export type TourStatus = (typeof TOUR_STATUSES)[number];

export const TOUR_TYPES = ["tour_planned", "tour_recorded"] as const;
export type TourType = (typeof TOUR_TYPES)[number];

// "id" is not supported by the Komoot API and is sorted client-side.
export const TOUR_SORT_FIELDS = [
    "name",
    "id",
    "date",
    "distance",
    "duration",
    "elevation"
] as const;
export type TourSortField = (typeof TOUR_SORT_FIELDS)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const UPLOAD_DATA_TYPES = ["gpx", "fit", "tcx"] as const;
export type UploadDataType = (typeof UPLOAD_DATA_TYPES)[number];

export interface StoredCredentials {
    userId: string;
    email: string;
    token: string;
}

export interface TourStatEntry {
    type: string;
    amount: number;
}

export interface TourStatsSummary {
    surfaces?: TourStatEntry[];
    way_types?: TourStatEntry[];
}

export interface TourDifficulty {
    grade: string;
    explanation_technical?: string;
    explanation_fitness?: string;
}

export interface TourSummary {
    id: number;
    name: string;
    type: TourType;
    sport: Sport;
    status: TourStatus;
    distance: number;
    duration: number;
    elevation_up: number;
    elevation_down: number;
    summary?: TourStatsSummary;
    difficulty?: TourDifficulty;
    date?: string;
    [key: string]: unknown;
}

export interface TourListResponse {
    _embedded?: {
        tours?: TourSummary[];
    };
    page?: {
        number: number;
        totalPages: number;
        totalElements?: number;
    };
    _links?: {
        next?: { href: string };
    };
}

export interface TourDetail extends TourSummary {
    _embedded?: Record<string, unknown>;
}

export interface UserProfile {
    _id: string;
    username?: string;
    display_name?: string;
    [key: string]: unknown;
}

export function isSport(value: string): value is Sport {
    return (ALL_SPORTS as readonly string[]).includes(value);
}

export function isTourStatus(value: string): value is TourStatus {
    return (TOUR_STATUSES as readonly string[]).includes(value);
}

export function isTourType(value: string): value is TourType {
    return (TOUR_TYPES as readonly string[]).includes(value);
}

export function isTourSortField(value: string): value is TourSortField {
    return (TOUR_SORT_FIELDS as readonly string[]).includes(value);
}

export function isSortDirection(value: string): value is SortDirection {
    return (SORT_DIRECTIONS as readonly string[]).includes(value);
}

export function isUploadDataType(value: string): value is UploadDataType {
    return (UPLOAD_DATA_TYPES as readonly string[]).includes(value);
}
