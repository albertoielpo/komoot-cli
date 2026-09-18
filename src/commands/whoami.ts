import type { Command } from "commander";
import { getUserProfile } from "../api/tours";
import { requireAuth } from "../util/context";
import { runAction } from "../util/errors";

export function registerWhoamiCommand(program: Command): void {
    program
        .command("whoami")
        .description("Show the currently logged-in account")
        .action(
            runAction(async () => {
                const creds = requireAuth();
                const profile = await getUserProfile(creds.userId, creds);
                const displayName =
                    profile.display_name ?? profile.username ?? "(unknown)";
                process.stdout.write(
                    `${displayName} (user id ${creds.userId}, ${creds.email})\n`
                );
            })
        );
}
