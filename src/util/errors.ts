import { ApiError } from "../api/client";

export class CliError extends Error {}

export function runAction(
    action: (...args: any[]) => Promise<void>
): (...args: any[]) => Promise<void> {
    return async (...args: any[]): Promise<void> => {
        try {
            await action(...args);
        } catch (err) {
            if (err instanceof ApiError || err instanceof CliError) {
                process.stderr.write(`Error: ${err.message}\n`);
            } else {
                process.stderr.write(
                    `Unexpected error: ${(err as Error).message}\n`
                );
            }
            process.exitCode = 1;
        }
    };
}
