import type { Command } from "commander";
import { clearCredentials } from "../api/credentials";
import { runAction } from "../util/errors";

export function registerLogoutCommand(program: Command): void {
    program
        .command("logout")
        .description("Clear stored Komoot credentials")
        .action(
            runAction(async () => {
                clearCredentials();
                process.stdout.write("Logged out.\n");
            })
        );
}
