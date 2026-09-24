import type { Command } from "commander";
import { listTours, listToursSortedById } from "../api/tours";
import {
    isSortDirection,
    isSport,
    isTourSortField,
    isTourType,
    TOUR_SORT_FIELDS,
    type TourSummary
} from "../types";
import { optionalAuth, requireAuth } from "../util/context";
import { CliError, runAction } from "../util/errors";
import { renderTable } from "../util/table";

interface ListOptions {
    user?: string;
    type?: string;
    sport?: string;
    name?: string;
    limit?: string;
    page?: string;
    orderby?: string;
    order?: string;
    json?: boolean;
}

function formatDistance(meters: number): string {
    return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h${minutes.toString().padStart(2, "0")}m`;
}

function formatElevation(meters: number): string {
    return `${Math.round(meters)} m`;
}

export function registerRoutesListCommand(routes: Command): void {
    routes
        .command("list")
        .description("List saved routes for your account or a public user")
        .option(
            "--user <id>",
            "numeric Komoot user id (public routes, no login required)"
        )
        .option("--type <type>", "tour_planned or tour_recorded")
        .option("--sport <type>", "filter by sport type")
        .option("--name <substr>", "filter by name substring")
        .option("--limit <n>", "page size", "25")
        .option("--page <n>", "page number", "0")
        .option("--orderby <field>", `sort by ${TOUR_SORT_FIELDS.join(", ")}`)
        .option("--order <direction>", "sort direction: asc or desc", "asc")
        .option("--json", "output raw JSON instead of a table")
        .action(
            runAction(async (options: ListOptions) => {
                if (options.type && !isTourType(options.type)) {
                    throw new CliError(
                        `Invalid --type "${options.type}". Expected tour_planned or tour_recorded.`
                    );
                }
                if (options.sport && !isSport(options.sport)) {
                    throw new CliError(`Invalid --sport "${options.sport}".`);
                }
                if (options.orderby && !isTourSortField(options.orderby)) {
                    throw new CliError(
                        `Invalid --orderby "${options.orderby}". Expected one of: ${TOUR_SORT_FIELDS.join(", ")}.`
                    );
                }
                if (options.order && !isSortDirection(options.order)) {
                    throw new CliError(
                        `Invalid --order "${options.order}". Expected asc or desc.`
                    );
                }

                let userId: string;
                let auth;
                let status: "public" | undefined;
                if (options.user) {
                    userId = options.user;
                    auth = optionalAuth();
                    status = "public";
                } else {
                    auth = requireAuth();
                    userId = auth.userId;
                }

                const params = {
                    type: options.type as any,
                    status,
                    sportTypes: options.sport,
                    name: options.name,
                    sortField: options.orderby,
                    sortDirection: options.orderby ? options.order : undefined,
                    limit: options.limit ? Number(options.limit) : undefined,
                    page: options.page ? Number(options.page) : undefined
                };
                const result =
                    options.orderby === "id"
                        ? await listToursSortedById(userId, params, auth)
                        : await listTours(userId, params, auth);

                const tours: TourSummary[] = result._embedded?.tours ?? [];

                if (options.json) {
                    process.stdout.write(
                        `${JSON.stringify(result, null, 2)}\n`
                    );
                    return;
                }

                if (tours.length === 0) {
                    process.stdout.write("No routes found.\n");
                    return;
                }

                const rows = tours.map((tour) => [
                    String(tour.id),
                    tour.name,
                    formatElevation(tour.elevation_up),
                    tour.status,
                    formatDistance(tour.distance),
                    formatDuration(tour.duration)
                ]);
                process.stdout.write(
                    `${renderTable(["ID", "NAME", "ELEVATION UP", "STATUS", "DISTANCE", "DURATION"], rows)}\n`
                );

                if (result.page) {
                    process.stdout.write(
                        `\nPage ${result.page.number + 1} of ${result.page.totalPages}\n`
                    );
                }
            })
        );
}
