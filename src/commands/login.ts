import type { Command } from "commander";
import { login } from "../api/auth";
import { saveCredentials } from "../api/credentials";
import { promptPassword, promptText } from "../util/prompt";
import { runAction } from "../util/errors";

export function registerLoginCommand(program: Command): void {
    program
        .command("login")
        .description("Log in to Komoot and store your credentials")
        .action(
            runAction(async () => {
                const email = await promptText("Email: ");
                const password = await promptPassword("Password: ");

                const creds = await login(email, password);
                saveCredentials(creds);

                process.stdout.write(
                    `Logged in as ${email} (user id ${creds.userId}).\n`
                );
            })
        );
}
