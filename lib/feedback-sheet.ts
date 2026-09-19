import { cache } from "react";

export const DATE_FEEDBACK_SHEET_ID = "1qZFVOpgNO8trazOO0utbh80ZWVrOJi7fUXwusFxFiKA";

export function csvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index], next = text[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell.trim()); if (row.some(Boolean)) rows.push(row); }
  return rows;
}

export const getFeedbackSheetRows = cache(async (tab: string) => {
  const response = await fetch(`https://docs.google.com/spreadsheets/d/${DATE_FEEDBACK_SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`Could not load ${tab} from the sister-date feedback sheet.`);
  const text = await response.text();
  if (/^\s*</.test(text)) throw new Error(`The sister-date sheet returned a login page instead of ${tab}.`);
  return csvRows(text);
});
