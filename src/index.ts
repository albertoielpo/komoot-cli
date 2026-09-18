import { Command } from "commander";
import { registerLoginCommand } from "./commands/login";
import { registerLogoutCommand } from "./commands/logout";
import { registerRoutesCommand } from "./commands/routes";
import { registerWhoamiCommand } from "./commands/whoami";
import { setVerbose } from "./debug";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require("../package.json") as {
    version: string;
    description: string;
};

export function run(argv: string[]): void {
    const program = new Command();

    // Checked directly against argv (rather than via commander's parsed
    // options) so --verbose works no matter where it appears on the line,
    // including after a subcommand, e.g. `komoot-cli routes list --verbose`.
    setVerbose(argv.includes("--verbose"));

    program
        .name("komoot-cli")
        .description(pkg.description)
        .version(pkg.version, "-V, --version")
        .option(
            "--verbose",
            "print verbose request/response logging to stderr"
        );

    registerLoginCommand(program);
    registerLogoutCommand(program);
    registerWhoamiCommand(program);
    registerRoutesCommand(program);

    // Strip --verbose here so subcommands (which don't each declare it) don't
    // reject it as an unknown option; setVerbose() above already captured it.
    const parsedArgv = argv.filter((arg) => arg !== "--verbose");

    program.parseAsync(parsedArgv).catch((err) => {
        process.stderr.write(`Unexpected error: ${(err as Error).message}\n`);
        process.exitCode = 1;
    });
}
