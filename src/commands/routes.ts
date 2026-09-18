import type { Command } from "commander";
import { registerRoutesDeleteCommand } from "./routes-delete";
import { registerRoutesDownloadCommand } from "./routes-download";
import { registerRoutesEditCommand } from "./routes-edit";
import { registerRoutesListCommand } from "./routes-list";
import { registerRoutesShowCommand } from "./routes-show";
import { registerRoutesUploadCommand } from "./routes-upload";

export function registerRoutesCommand(program: Command): void {
    const routes = program
        .command("routes")
        .description("Manage Komoot routes (tours)");

    registerRoutesListCommand(routes);
    registerRoutesShowCommand(routes);
    registerRoutesDownloadCommand(routes);
    registerRoutesEditCommand(routes);
    registerRoutesDeleteCommand(routes);
    registerRoutesUploadCommand(routes);
}
