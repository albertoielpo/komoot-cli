import { renderTable } from "../../src/util/table";

describe("renderTable", () => {
    it("aligns columns to the widest cell", () => {
        const output = renderTable(
            ["ID", "NAME"],
            [
                ["1", "Short"],
                ["2", "A much longer name"]
            ]
        );
        const lines = output.split("\n");
        expect(lines[0]).toBe("ID  NAME");
        expect(lines[1]).toBe(`--  ${"-".repeat("A much longer name".length)}`);
        expect(lines[2]).toBe("1   Short");
        expect(lines[3]).toBe("2   A much longer name");
    });

    it("handles no rows", () => {
        const output = renderTable(["A", "B"], []);
        expect(output).toBe("A  B\n-  -");
    });
});
