import { loadCredentials } from "../api/credentials";
import type { StoredCredentials } from "../types";
import { CliError } from "./errors";

export function requireAuth(): StoredCredentials {
    const creds = loadCredentials();
    if (!creds) {
        throw new CliError("Not logged in. Run `komoot-cli login` first.");
    }
    return creds;
}

export function optionalAuth(): StoredCredentials | undefined {
    return loadCredentials();
}
