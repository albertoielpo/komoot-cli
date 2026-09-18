import { MockAgent, setGlobalDispatcher } from "undici";
import { apiFetch, apiJson, ApiError } from "../../src/api/client";

describe("apiFetch / apiJson", () => {
    let mockAgent: MockAgent;

    beforeEach(() => {
        mockAgent = new MockAgent();
        mockAgent.disableNetConnect();
        setGlobalDispatcher(mockAgent);
    });

    it("sends Basic auth header when auth is provided", async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({
            path: "/v007/tours/1",
            method: "GET",
            headers: (headers) => {
                const expected = `Basic ${Buffer.from("42:tok").toString("base64")}`;
                return headers["authorization"] === expected;
            }
        }).reply(200, { id: 1 });

        const result = await apiJson<{ id: number }>(
            "https://api.komoot.de/v007/tours/1",
            {
                auth: { userId: "42", token: "tok", email: "a@b.com" }
            }
        );
        expect(result.id).toBe(1);
    });

    it("sends application/hal+json as Accept for apiJson", async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({
            path: "/v007/tours/1",
            method: "GET",
            headers: (headers) => headers["accept"] === "application/hal+json"
        }).reply(200, { id: 1 });

        await apiJson("https://api.komoot.de/v007/tours/1");
    });

    it('maps 401 to a clear "not logged in" ApiError', async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({ path: "/v007/tours/1", method: "GET" }).reply(401, "");

        await expect(
            apiFetch("https://api.komoot.de/v007/tours/1")
        ).rejects.toMatchObject({
            code: "UNAUTHORIZED",
            message: expect.stringContaining("komoot-cli login")
        } satisfies Partial<ApiError>);
    });

    it('maps 404 to a "not found" ApiError', async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({ path: "/v007/tours/999", method: "GET" }).reply(
            404,
            ""
        );

        await expect(
            apiFetch("https://api.komoot.de/v007/tours/999")
        ).rejects.toMatchObject({
            code: "NOT_FOUND"
        });
    });

    it("retries on 5xx and succeeds on a later attempt", async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({ path: "/v007/tours/1", method: "GET" }).reply(500, "");
        pool.intercept({ path: "/v007/tours/1", method: "GET" }).reply(200, {
            id: 1
        });

        const result = await apiJson<{ id: number }>(
            "https://api.komoot.de/v007/tours/1",
            { retries: 2 }
        );
        expect(result.id).toBe(1);
    });

    it("gives up after exhausting retries on repeated 5xx", async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({ path: "/v007/tours/1", method: "GET" }).reply(500, "");
        pool.intercept({ path: "/v007/tours/1", method: "GET" }).reply(500, "");

        await expect(
            apiFetch("https://api.komoot.de/v007/tours/1", { retries: 1 })
        ).rejects.toMatchObject({
            code: "SERVER_ERROR"
        });
    });

    it("builds query strings from provided params, skipping undefined values", async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({
            path: "/v007/users/1/tours/?limit=5",
            method: "GET"
        }).reply(200, {});

        await apiJson("https://api.komoot.de/v007/users/1/tours/", {
            query: { limit: 5, page: undefined }
        });
    });
});
