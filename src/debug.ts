let verbose = false;

export function setVerbose(value: boolean): void {
    verbose = value;
}

export function isVerbose(): boolean {
    return verbose;
}

/** Logs to stderr when --verbose is set. Never pass secrets (tokens/passwords) to this. */
export function debugLog(message: string): void {
    if (verbose) {
        process.stderr.write(`[verbose] ${message}\n`);
    }
}
