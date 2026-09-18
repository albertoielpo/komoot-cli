export function renderTable(headers: string[], rows: string[][]): string {
    const widths = headers.map((header, col) =>
        Math.max(header.length, ...rows.map((row) => (row[col] ?? "").length))
    );

    const renderRow = (cells: string[]): string =>
        cells
            .map((cell, col) => cell.padEnd(widths[col]))
            .join("  ")
            .trimEnd();

    const separator = widths.map((w) => "-".repeat(w)).join("  ");

    return [renderRow(headers), separator, ...rows.map(renderRow)].join("\n");
}
