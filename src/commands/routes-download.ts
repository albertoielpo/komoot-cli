import fs from "node:fs";
import type { Command } from "commander";
import { downloadFit, downloadGpx } from "../api/tours";
import { requireAuth } from "../util/context";
import { CliError, runAction } from "../util/errors";

interface DownloadOptions {
    format?: string;
    output?: string;
    user?: string;
}

export function registerRoutesDownloadCommand(routes: Command): void {
    routes
        .command("download <tour-id>")
        .description("Download a tour as GPX or FIT")
        .option("--format <fmt>", "gpx or fit", "gpx")
        .option(
            "--output <path>",
            "output file path (defaults to <tour-id>.<format>)"
        )
        .option("--user <id>", "download a public tour without logging in")
        .action(
            runAction(async (tourId: string, options: DownloadOptions) => {
                const format = (options.format ?? "gpx").toLowerCase();
                if (format !== "gpx" && format !== "fit") {
                    throw new CliError(
                        `Invalid --format "${options.format}". Expected gpx or fit.`
                    );
                }

                const outputPath = options.output ?? `${tourId}.${format}`;

                if (options.user) {
                    // Public tour: fetch without authentication, per plan §1.
                    if (format === "gpx") {
                        fs.writeFileSync(outputPath, await downloadGpx(tourId));
                    } else {
                        fs.writeFileSync(outputPath, await downloadFit(tourId));
                    }
                } else {
                    const auth = requireAuth();
                    if (format === "gpx") {
                        fs.writeFileSync(
                            outputPath,
                            await downloadGpx(tourId, auth)
                        );
                    } else {
                        fs.writeFileSync(
                            outputPath,
                            await downloadFit(tourId, auth)
                        );
                    }
                }

                process.stdout.write(`Saved ${outputPath}\n`);
            })
        );
}
