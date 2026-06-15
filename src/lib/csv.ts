export function downloadCSV(rows: Record<string, string>[], filename: string) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers,
    ...rows.map((r) =>
      headers.map((h) => {
        const v = String(r[h] ?? "");
        const safe = /^[=+\-@|]/.test(v) ? `'${v}` : v;
        return `"${safe.replace(/"/g, '""')}"`;
      })
    ),
  ]
    .map((r) => r.join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}