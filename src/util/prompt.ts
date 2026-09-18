import readline from "node:readline";

export function promptText(question: string): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/** Reads a line from stdin without echoing it (for password entry). */
export function promptPassword(question: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const stdin = process.stdin;
        process.stdout.write(question);

        if (!stdin.isTTY) {
            // Non-interactive input (e.g. piped): fall back to a plain readline read.
            const rl = readline.createInterface({
                input: stdin,
                output: process.stdout
            });
            rl.question("", (answer) => {
                rl.close();
                resolve(answer.trim());
            });
            return;
        }

        const wasRaw = stdin.isRaw;
        stdin.setRawMode(true);
        stdin.resume();
        stdin.setEncoding("utf8");

        let value = "";

        const onData = (chunk: string): void => {
            for (const char of chunk) {
                if (char === "\n" || char === "\r") {
                    cleanup();
                    process.stdout.write("\n");
                    resolve(value);
                    return;
                } else if (char === "") {
                    // Ctrl+C
                    cleanup();
                    reject(new Error("Aborted."));
                    return;
                } else if (char === "" || char === "\b") {
                    value = value.slice(0, -1);
                } else {
                    value += char;
                }
            }
        };

        const cleanup = (): void => {
            stdin.removeListener("data", onData);
            stdin.setRawMode(wasRaw ?? false);
            stdin.pause();
        };

        stdin.on("data", onData);
    });
}
