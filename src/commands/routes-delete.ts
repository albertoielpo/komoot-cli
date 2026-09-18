import type { Command } from "commander";
import { deleteTour } from "../api/tours";
import { requireAuth } from "../util/context";
import { runAction } from "../util/errors";

export function registerRoutesDeleteCommand(routes: Command): void {
    routes
        .command("delete <tour-id>")
        .description("Delete a tour")
        .action(
            runAction(async (tourId: string) => {
                const auth = requireAuth();
                await deleteTour(tourId, auth);
                process.stdout.write(`Deleted tour ${tourId}\n`);
            })
        );
}
