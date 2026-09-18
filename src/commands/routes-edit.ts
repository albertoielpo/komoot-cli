import type { Command } from "commander";
import { editTour, type EditTourPatch } from "../api/tours";
import { isSport, isTourStatus } from "../types";
import { requireAuth } from "../util/context";
import { CliError, runAction } from "../util/errors";

interface EditOptions {
    name?: string;
    sport?: string;
    status?: string;
}

export function registerRoutesEditCommand(routes: Command): void {
    routes
        .command("edit <tour-id>")
        .description(
            "Edit a tour's metadata (name, sport, status). Waypoint/path editing is not supported."
        )
        .option("--name <str>", "new name")
        .option("--sport <type>", "new sport type")
        .option("--status <status>", "public, private, or friends")
        .action(
            runAction(async (tourId: string, options: EditOptions) => {
                if (options.sport && !isSport(options.sport)) {
                    throw new CliError(`Invalid --sport "${options.sport}".`);
                }
                if (options.status && !isTourStatus(options.status)) {
                    throw new CliError(
                        `Invalid --status "${options.status}". Expected public, private, or friends.`
                    );
                }

                const patch: EditTourPatch = {};
                if (options.name !== undefined) patch.name = options.name;
                if (options.sport !== undefined)
                    patch.sport = options.sport as any;
                if (options.status !== undefined)
                    patch.status = options.status as any;

                if (Object.keys(patch).length === 0) {
                    throw new CliError(
                        "Nothing to update: pass at least one of --name, --sport, --status."
                    );
                }

                const auth = requireAuth();
                const tour = await editTour(tourId, patch, auth);
                process.stdout.write(
                    `Updated tour ${tour.id}: ${tour.name} (${tour.sport}, ${tour.status})\n`
                );
            })
        );
}
