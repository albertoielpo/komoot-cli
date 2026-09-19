import type { Command } from "commander";
import { getTour } from "../api/tours";
import type { TourStatEntry } from "../types";
import { optionalAuth } from "../util/context";
import { runAction } from "../util/errors";

function prettifyType(type: string): string {
    const name = type.includes("#") ? type.split("#")[1] : type;
    return name
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function formatBreakdown(entries: TourStatEntry[] | undefined): string {
    if (!entries || entries.length === 0) {
        return "n/a";
    }
    return [...entries]
        .sort((a, b) => b.amount - a.amount)
        .map(
            (entry) => `${prettifyType(entry.type)} ${(entry.amount * 100).toFixed(1)}%`
        )
        .join(", ");
}

export function registerRoutesShowCommand(routes: Command): void {
    routes
        .command("show <tour-id>")
        .description("Show details for a tour (own or public)")
        .option("--json", "output raw JSON instead of a summary")
        .action(
            runAction(async (tourId: string, options: { json?: boolean }) => {
                const auth = optionalAuth();
                const tour = await getTour(tourId, auth);

                if (options.json) {
                    process.stdout.write(`${JSON.stringify(tour, null, 2)}\n`);
                    return;
                }

                process.stdout.write(
                    [
                        `ID:              ${tour.id}`,
                        `Name:            ${tour.name}`,
                        `Sport:           ${tour.sport}`,
                        `Status:          ${tour.status}`,
                        `Distance:        ${(tour.distance / 1000).toFixed(1)} km`,
                        `Duration:        ${Math.round(tour.duration / 60)} min`,
                        `Elevation up:    ${Math.round(tour.elevation_up)} m`,
                        `Elevation down:  ${Math.round(tour.elevation_down)} m`,
                        `Difficulty:      ${tour.difficulty?.grade ?? "n/a"}`,
                        `Surfaces:        ${formatBreakdown(tour.summary?.surfaces)}`,
                        `Way types:       ${formatBreakdown(tour.summary?.way_types)}`
                    ].join("\n") + "\n"
                );
            })
        );
}
