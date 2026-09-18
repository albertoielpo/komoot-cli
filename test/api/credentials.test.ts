import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
    clearCredentials,
    loadCredentials,
    saveCredentials
} from "../../src/api/credentials";

describe("credentials (keyring unavailable -> plaintext fallback)", () => {
    let tmpDir: string;
    const originalConfigDir = process.env.KOMOOT_CLI_CONFIG_DIR;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "komoot-cli-test-"));
        process.env.KOMOOT_CLI_CONFIG_DIR = tmpDir;
        jest.doMock("@napi-rs/keyring", () => {
            throw new Error("keyring not available in test env");
        });
    });

    afterEach(() => {
        jest.dontMock("@napi-rs/keyring");
        fs.rmSync(tmpDir, { recursive: true, force: true });
        process.env.KOMOOT_CLI_CONFIG_DIR = originalConfigDir;
    });

    it("writes a chmod-600 plaintext file when the keyring is unavailable", () => {
        saveCredentials({ userId: "1", email: "a@b.com", token: "tok" });

        const file = path.join(tmpDir, "credentials.json");
        expect(fs.existsSync(file)).toBe(true);
        expect(fs.statSync(file).mode & 0o777).toBe(0o600);
    });

    it("round-trips credentials through save/load", () => {
        saveCredentials({ userId: "1", email: "a@b.com", token: "tok" });
        expect(loadCredentials()).toEqual({
            userId: "1",
            email: "a@b.com",
            token: "tok"
        });
    });

    it("returns undefined when nothing has been saved", () => {
        expect(loadCredentials()).toBeUndefined();
    });

    it("clearCredentials removes the fallback file", () => {
        saveCredentials({ userId: "1", email: "a@b.com", token: "tok" });
        clearCredentials();
        expect(loadCredentials()).toBeUndefined();
    });
});
