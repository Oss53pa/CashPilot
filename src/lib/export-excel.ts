import * as XLSX from "xlsx";

/**
 * Export an array of objects to an Excel (.xlsx) file and trigger a browser download.
 *
 * @param data      - Array of flat objects to export as rows.
 * @param filename  - Download file name (without extension).
 * @param sheetName - Optional worksheet name (default "Sheet1").
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  filename: string,
  sheetName: string = "Sheet1",
): void {
  if (!data.length) {
    console.warn("exportToExcel: No data to export.");
    return;
  }

  // Create a new workbook and worksheet from the JSON data.
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-size columns based on header + content widths.
  const headers = Object.keys(data[0]);
  worksheet["!cols"] = headers.map((header) => {
    const maxContentLength = data.reduce((max, row) => {
      const cellValue = String(row[header] ?? "");
      return Math.max(max, cellValue.length);
    }, header.length);

    return { wch: Math.min(maxContentLength + 2, 50) };
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write the workbook and trigger a download in the browser.
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export an array of objects to a CSV file and trigger a browser download.
 *
 * @param data     - Array of flat objects to export as rows.
 * @param filename - Download file name (without extension).
 */
export function exportToCsv(
  data: Record<string, unknown>[],
  filename: string,
): void {
  if (!data.length) {
    console.warn("exportToCsv: No data to export.");
    return;
  }

  const headers = Object.keys(data[0]);

  // Build CSV content with proper escaping
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.map(escapeCsvField).join(","));

  // Data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      return escapeCsvField(value == null ? "" : String(value));
    });
    csvRows.push(values.join(","));
  }

  const csvContent = csvRows.join("\n");

  // BOM prefix for proper UTF-8 handling in Excel
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Trigger download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape a field for CSV. If the value contains a comma, newline, or
 * double-quote, wrap it in double-quotes and escape internal quotes.
 */
function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes("\n") || field.includes('"')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
