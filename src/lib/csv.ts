export function toCSV<T>(rows: T[], columns: { header: string; value: (row: T) => unknown }[]): string {
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    if (val instanceof Date) return val.toISOString();
    const s = typeof val === "string" ? val : String(val);
    if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const header = columns.map((c) => escape(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escape(c.value(r))).join(",")).join("\n");
  return header + "\n" + body;
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
