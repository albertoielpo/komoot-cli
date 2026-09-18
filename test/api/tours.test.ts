import { MockAgent, setGlobalDispatcher } from "undici";
import { deleteTour, editTour, getTour, listTours } from "../../src/api/tours";

const auth = { userId: "42", token: "tok", email: "a@b.com" };

describe("tours API", () => {
    let mockAgent: MockAgent;

    beforeEach(() => {
        mockAgent = new MockAgent();
        mockAgent.disableNetConnect();
        setGlobalDispatcher(mockAgent);
    });

    it("lists tours with the expected query params", async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({
            path: "/v007/users/42/tours/?type=tour_planned&status=public&sport_types=hike&limit=10&page=0",
            method: "GET"
        }).reply(200, {
            _embedded: { tours: [] },
            page: { number: 0, totalPages: 1 }
        });

        const result = await listTours(
            "42",
            {
                type: "tour_planned",
                status: "public",
                sportTypes: "hike",
                limit: 10,
                page: 0
            },
            auth
        );
        expect(result.page?.totalPages).toBe(1);
    });

    it("fetches a single tour with embedded extras", async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({
            path: "/v007/tours/123?_embedded=coordinates%2Cway_types%2Csurfaces%2Cdirections",
            method: "GET"
        }).reply(200, { id: 123, name: "Test tour" });

        const tour = await getTour("123");
        expect(tour.name).toBe("Test tour");
    });

    it("sends a PATCH body for editTour with only the provided fields", async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({
            path: "/v007/tours/123",
            method: "PATCH",
            body: JSON.stringify({ name: "New name" })
        }).reply(200, { id: 123, name: "New name" });

        const tour = await editTour("123", { name: "New name" }, auth);
        expect(tour.name).toBe("New name");
    });

    it("sends DELETE for deleteTour", async () => {
        const pool = mockAgent.get("https://api.komoot.de");
        pool.intercept({ path: "/v007/tours/123", method: "DELETE" }).reply(
            204,
            ""
        );

        await expect(deleteTour("123", auth)).resolves.toBeUndefined();
    });
});
