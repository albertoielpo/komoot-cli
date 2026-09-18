import fs from "node:fs";
import path from "node:path";
import type { Command } from "commander";
import { uploadTour } from "../api/tours";
import { isSport, isUploadDataType } from "../types";
import { requireAuth } from "../util/context";
import { CliError, runAction } from "../util/errors";

interface UploadOptions {
    sport?: string;
    name?: string;
    format?: string;
}

export function registerRoutesUploadCommand(routes: Command): void {
    routes
        .command("upload <file>")
        .description("Upload a GPX/FIT/TCX recording as a new tour")
        .option("--sport <type>", "sport type")
        .option("--name <str>", "tour name")
        .option(
            "--format <fmt>",
            "gpx, fit, or tcx (defaults to the file extension)"
        )
        .action(
            runAction(async (file: string, options: UploadOptions) => {
                if (!fs.existsSync(file)) {
                    throw new CliError(`File not found: ${file}`);
                }

                const dataType = (
                    options.format ?? path.extname(file).slice(1)
                ).toLowerCase();
                if (!isUploadDataType(dataType)) {
                    throw new CliError(
                        `Cannot determine upload format for "${file}". Pass --format gpx|fit|tcx.`
                    );
                }

                if (options.sport && !isSport(options.sport)) {
                    throw new CliError(`Invalid --sport "${options.sport}".`);
                }

                const auth = requireAuth();
                const result = await uploadTour(
                    file,
                    {
                        dataType,
                        sport: options.sport as any,
                        name: options.name
                    },
                    auth
                );

                if (result.duplicate) {
                    process.stdout.write(
                        `This recording matches an existing tour: ${result.tour.id} (${result.tour.name})\n`
                    );
                } else {
                    process.stdout.write(
                        `Uploaded as tour ${result.tour.id}: ${result.tour.name}\n`
                    );
                }
            })
        );
}
