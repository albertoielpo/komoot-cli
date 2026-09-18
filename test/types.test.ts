import {
    isSport,
    isTourStatus,
    isTourType,
    isUploadDataType
} from "../src/types";

describe("type guards", () => {
    it("accepts valid sports and rejects unknown ones", () => {
        expect(isSport("racebike")).toBe(true);
        expect(isSport("mtb_advanced")).toBe(true);
        expect(isSport("not-a-sport")).toBe(false);
    });

    it("accepts valid tour statuses only", () => {
        expect(isTourStatus("public")).toBe(true);
        expect(isTourStatus("friends")).toBe(true);
        expect(isTourStatus("archived")).toBe(false);
    });

    it("accepts valid tour types only", () => {
        expect(isTourType("tour_planned")).toBe(true);
        expect(isTourType("tour_active")).toBe(false);
    });

    it("accepts valid upload data types only", () => {
        expect(isUploadDataType("gpx")).toBe(true);
        expect(isUploadDataType("kml")).toBe(false);
    });
});
