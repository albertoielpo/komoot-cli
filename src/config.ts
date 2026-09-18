import os from "node:os";
import path from "node:path";

/**
 * Evaluated lazily (not cached at import time) so KOMOOT_CLI_CONFIG_DIR can
 * override it per-call — used by tests to avoid touching the real
 * ~/.config/komoot-cli, since os.homedir() reads the real environment
 * independently of any test-sandboxed process.env.
 */
export function getConfigDir(): string {
    return (
        process.env.KOMOOT_CLI_CONFIG_DIR ??
        path.join(os.homedir(), ".config", "komoot-cli")
    );
}

export function getCredentialsFile(): string {
    return path.join(getConfigDir(), "credentials.json");
}

export const KEYCHAIN_SERVICE = "komoot-cli";

export const API_BASE_URL = "https://api.komoot.de";
export const WWW_BASE_URL = "https://www.komoot.de";

export const USER_AGENT = `komoot-cli/${require("../package.json").version as string}`;
