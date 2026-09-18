import type { Command } from "commander";
import { getTour } from "../api/tours";
import { optionalAuth } from "../util/context";
import { runAction } from "../util/errors";

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
                        `ID:       ${tour.id}`,
                        `Name:     ${tour.name}`,
                        `Sport:    ${tour.sport}`,
                        `Status:   ${tour.status}`,
                        `Distance: ${(tour.distance / 1000).toFixed(1)} km`,
                        `Duration: ${Math.round(tour.duration / 60)} min`
                    ].join("\n") + "\n"
                );
            })
        );
}
