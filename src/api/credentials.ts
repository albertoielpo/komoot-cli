import fs from "node:fs";
import path from "node:path";
import { getConfigDir, getCredentialsFile, KEYCHAIN_SERVICE } from "../config";
import { debugLog } from "../debug";
import type { StoredCredentials } from "../types";

// Lazily required: on platforms/environments without a native keyring backend
// available, even loading this module can throw, so we must not do it eagerly.
type KeyringEntry = {
    setPassword(password: string): void;
    getPassword(): string | null;
    deletePassword(): boolean;
};

function loadKeyringEntry(account: string): KeyringEntry | undefined {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Entry } = require("@napi-rs/keyring") as {
            Entry: new (service: string, account: string) => KeyringEntry;
        };
        return new Entry(KEYCHAIN_SERVICE, account);
    } catch (err) {
        debugLog(`keyring unavailable: ${(err as Error).message}`);
        return undefined;
    }
}

function fallbackWrite(creds: StoredCredentials): void {
    const credentialsFile = getCredentialsFile();
    fs.mkdirSync(getConfigDir(), { recursive: true, mode: 0o700 });
    fs.writeFileSync(credentialsFile, JSON.stringify(creds, null, 2), {
        mode: 0o600
    });
    fs.chmodSync(credentialsFile, 0o600);
    process.stderr.write(
        `Warning: could not access the OS keychain; credentials were stored unencrypted at ${credentialsFile}\n`
    );
}

function fallbackRead(): StoredCredentials | undefined {
    const credentialsFile = getCredentialsFile();
    if (!fs.existsSync(credentialsFile)) {
        return undefined;
    }
    const raw = fs.readFileSync(credentialsFile, "utf8");
    return JSON.parse(raw) as StoredCredentials;
}

function fallbackClear(): void {
    const credentialsFile = getCredentialsFile();
    if (fs.existsSync(credentialsFile)) {
        fs.unlinkSync(credentialsFile);
    }
}

export function saveCredentials(creds: StoredCredentials): void {
    const entry = loadKeyringEntry(creds.email);
    if (entry) {
        try {
            entry.setPassword(JSON.stringify(creds));
            rememberAccountPointer(creds.email);
            return;
        } catch (err) {
            debugLog(`keyring setPassword failed: ${(err as Error).message}`);
        }
    }
    fallbackWrite(creds);
}

export function loadCredentials(): StoredCredentials | undefined {
    const fallback = fallbackRead();
    if (fallback) {
        return fallback;
    }

    // We don't know the account (email) up front when only reading, so we keep
    // a pointer to it in the fallback file when the keychain path is used too.
    const pointerPath = path.join(getConfigDir(), "account");
    if (!fs.existsSync(pointerPath)) {
        return undefined;
    }
    const email = fs.readFileSync(pointerPath, "utf8").trim();
    if (!email) {
        return undefined;
    }
    const entry = loadKeyringEntry(email);
    if (!entry) {
        return undefined;
    }
    try {
        const raw = entry.getPassword();
        return raw ? (JSON.parse(raw) as StoredCredentials) : undefined;
    } catch (err) {
        debugLog(`keyring getPassword failed: ${(err as Error).message}`);
        return undefined;
    }
}

export function clearCredentials(): void {
    fallbackClear();
    const pointerPath = path.join(getConfigDir(), "account");
    if (fs.existsSync(pointerPath)) {
        const email = fs.readFileSync(pointerPath, "utf8").trim();
        fs.unlinkSync(pointerPath);
        if (email) {
            const entry = loadKeyringEntry(email);
            try {
                entry?.deletePassword();
            } catch (err) {
                debugLog(
                    `keyring deletePassword failed: ${(err as Error).message}`
                );
            }
        }
    }
}

export function rememberAccountPointer(email: string): void {
    fs.mkdirSync(getConfigDir(), { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(getConfigDir(), "account"), email, {
        mode: 0o600
    });
}
