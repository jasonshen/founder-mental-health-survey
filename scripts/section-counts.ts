import { readFileSync } from "node:fs";
import { SECTION_COLUMN } from "../lib/types";
import { SECTION_ORDER } from "../lib/questions";

function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (q) {
      if (c === '"') {
        if (input[i + 1] === '"') { cell += '"'; i++; continue; }
        q = false; continue;
      }
      cell += c; continue;
    }
    if (c === '"') { q = true; continue; }
    if (c === ",") { row.push(cell); cell = ""; continue; }
    if (c === "\r") continue;
    if (c === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; continue; }
    cell += c;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  const headers = rows[0];
  return rows.slice(1).filter((r) => r.length > 1).map((r) =>
    Object.fromEntries(headers.map((h, j) => [h, r[j] ?? ""])),
  );
}

const csv = readFileSync(process.argv[2], "utf-8");
const rows = parseCsv(csv);

console.log(`Total rows: ${rows.length}`);
const completed = rows.filter((r) => r.completed === "true").length;
console.log(`Completed (completed=true): ${completed}`);
console.log(`By cohort:`);
const byCohort = new Map<string, number>();
for (const r of rows) byCohort.set(r.cohort || "?", (byCohort.get(r.cohort || "?") ?? 0) + 1);
for (const [k, v] of byCohort) console.log(`  ${k}: ${v}`);

console.log("\nPer-section N (rows where the section_* JSONB column is non-empty):\n");
console.log("section_id                  | all  | completed | yc   | general | status");
console.log("----------------------------|------|-----------|------|---------|-------");
const summary: Array<{ id: string; nAll: number; nDone: number; ready: boolean }> = [];
for (const sid of SECTION_ORDER) {
  const col = (SECTION_COLUMN as Record<string, string>)[sid];
  if (!col) continue;
  let nAll = 0, nDone = 0, nYc = 0, nGen = 0;
  for (const r of rows) {
    const v = r[col];
    if (!v || v === "" || v === "{}") continue;
    nAll++;
    if (r.completed === "true") nDone++;
    if (r.cohort === "yc") nYc++;
    if (r.cohort === "general") nGen++;
  }
  const ready = nAll >= 100;
  summary.push({ id: sid, nAll, nDone, ready });
  const status = ready ? "READY" : `${100 - nAll} more`;
  console.log(
    `${sid.padEnd(27)} | ${String(nAll).padStart(4)} | ${String(nDone).padStart(9)} | ${String(nYc).padStart(4)} | ${String(nGen).padStart(7)} | ${status}`,
  );
}

console.log("\nSections ready for comparison (N≥100):");
for (const s of summary.filter((s) => s.ready)) console.log(`  ✅ ${s.id} (${s.nAll})`);
console.log("\nSections still collecting:");
for (const s of summary.filter((s) => !s.ready)) console.log(`  ⏳ ${s.id} — ${s.nAll} / 100 (${100 - s.nAll} more)`);
