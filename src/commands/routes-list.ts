import type { Command } from "commander";
import { listTours } from "../api/tours";
import { isSport, isTourType, type TourSummary } from "../types";
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

                const result = await listTours(
                    userId,
                    {
                        type: options.type as any,
                        status,
                        sportTypes: options.sport,
                        name: options.name,
                        limit: options.limit
                            ? Number(options.limit)
                            : undefined,
                        page: options.page ? Number(options.page) : undefined
                    },
                    auth
                );

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
                    tour.sport,
                    tour.status,
                    formatDistance(tour.distance),
                    formatDuration(tour.duration)
                ]);
                process.stdout.write(
                    `${renderTable(["ID", "NAME", "SPORT", "STATUS", "DISTANCE", "DURATION"], rows)}\n`
                );

                if (result.page) {
                    process.stdout.write(
                        `\nPage ${result.page.number + 1} of ${result.page.totalPages}\n`
                    );
                }
            })
        );
}
