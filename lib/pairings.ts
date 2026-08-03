type Row = string[];

const PAIRINGS_ID = "13ujZbP1nbzHHfH1nWDIrBm-uUy2HVz9KP0VFaY6TCWQ";
const FEEDBACK_ID = "1ZXvWowqei0UmO-Wpp3aiGDVE_X8o_JNgSjfIEYUsmZ8";

export type PairingRecommendation = {
  newMember: string;
  matches: { name: string; score: number; mandatory: boolean; reason: string }[];
  notes: string[];
};

function csv(text: string): Row[] {
  const rows: Row[] = []; let row: string[] = []; let value = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) { const char = text[i]; const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(value.trim()); value = ""; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && next === '\n') i += 1; row.push(value.trim()); if (row.some(Boolean)) rows.push(row); row = []; value = ""; }
    else value += char;
  }
  if (value || row.length) { row.push(value.trim()); rows.push(row); } return rows;
}

async function sheet(id: string, tab: string) {
  const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${tab}.`);
  return csv(await response.text());
}

export type ExistingWeekPairing = { primary: string; partners: string[] };

export async function getExistingWeekPairings() {
  const [pc28, pc29] = await Promise.all([sheet(PAIRINGS_ID, "PC 28"), sheet(PAIRINGS_ID, "PC 29")]);
  const parse = (rows: Row[], week: number) => {
    const headers = rows[0]; const primaryColumn = column(headers, "pc 28"); const start = headers.findIndex((header) => key(header) === `week ${week} pairings`); if (start < 0) return [] as ExistingWeekPairing[];
    const next = headers.findIndex((header, index) => index > start && key(header).startsWith("week")); const end = next > -1 ? next : headers.findIndex((header, index) => index > start && key(header).startsWith("extra dates"));
    return rows.slice(1).map((row) => ({ primary: row[primaryColumn] || "", partners: row.slice(start, end > -1 ? end : start + 3).filter(Boolean) })).filter((pairing) => pairing.primary);
  };
  return { pc29: Object.fromEntries([1, 2, 3, 4, 5].map((week) => [week, parse(pc29, week)])), pc28: Object.fromEntries([1, 2, 3, 4, 5].map((week) => [week, parse(pc28, week)])) };
}

function key(value: string) { return value.toLowerCase().replace(/\([^)]*\)/g, "").replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim(); }
function split(value: string) { return value.split(/[;,\n]+/).map((item) => item.trim()).filter(Boolean); }
function column(headers: Row, term: string) { return headers.findIndex((header) => key(header).includes(key(term))); }
function score(row: Row, headers: Row) {
  const get = (term: string) => row[column(headers, term)] || "";
  let total = 0; const enjoy = get("enjoy"); const again = get("another date");
  if (enjoy === "Yes") total += 1; else if (["Somewhat", "Maybe"].includes(enjoy)) total += .5;
  if (again === "Yes") total += 1; else if (again === "Maybe") total += .5;
  for (const term of ["comfortable", "similar"]) total += Number(get(term)) / 5 || 0;
  if (get("red flags")) total -= 1;
  return total / 6;
}

function cosine(left: number[], right: number[]) { const dot = left.reduce((sum, value, index) => sum + value * right[index], 0); const magnitude = (values: number[]) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)); return dot / (magnitude(left) * magnitude(right) || 1); }

export async function getWeekSixRecommendations(): Promise<PairingRecommendation[]> {
  const [pc28, pc29, similarity, feedback] = await Promise.all([sheet(PAIRINGS_ID, "PC 28"), sheet(PAIRINGS_ID, "PC 29"), sheet(PAIRINGS_ID, "Similarity Matrix"), sheet(FEEDBACK_ID, "Form Responses 1")]);
  const oldHeaders = pc28[0], newHeaders = pc29[0];
  const oldNameCol = column(oldHeaders, "pc 28"), newNameCol = column(newHeaders, "pc 28");
  const oldNames = pc28.slice(1).map((row) => row[oldNameCol]).filter(Boolean);
  const newNames = pc29.slice(1).map((row) => row[newNameCol]).filter(Boolean);
  const allNames = [...oldNames, ...newNames]; const resolve = (value: string) => { const normal = key(value); return allNames.find((name) => key(name) === normal) || allNames.find((name) => key(name).split(" ")[0] === normal) || null; };
  const history = new Map<string, Set<string>>(); const hardNos = new Set<string>(); const mandatory = new Set<string>();
  const loadPairs = (rows: Row[], headers: Row, isNewTab: boolean) => { const personCol = column(headers, "pc 28"); const hardCol = column(headers, "hard nos"); const requestCol = column(headers, "requests"); const numberCol = column(headers, "number of");
    for (const row of rows.slice(1)) { const person = resolve(row[personCol] || ""); if (!person) continue; const isNew = isNewTab; const add = (value: string, target: Set<string>) => split(value).forEach((raw) => { const other = resolve(raw); if (!other || other === person) return; const newer = isNew ? person : other; const older = isNew ? other : person; if (newNames.includes(newer) && oldNames.includes(older)) target.add(`${newer}|${older}`); });
      add(row[hardCol] || "", hardNos); add(row[requestCol] || "", mandatory);
      for (let index = personCol + 1; index < (numberCol > -1 ? numberCol : row.length); index += 1) add(row[index] || "", new Set<string>());
      const dated = new Set<string>(); for (let index = personCol + 1; index < (numberCol > -1 ? numberCol : row.length); index += 1) split(row[index] || "").forEach((raw) => { const other = resolve(raw); if (!other || other === person) return; const newer = isNew ? person : other; const older = isNew ? other : person; if (newNames.includes(newer) && oldNames.includes(older)) dated.add(`${newer}|${older}`); });
      dated.forEach((pair) => { const [newer, older] = pair.split("|"); if (!history.has(newer)) history.set(newer, new Set()); history.get(newer)?.add(older); });
    }
  };
  loadPairs(pc29, newHeaders, true); loadPairs(pc28, oldHeaders, false);
  const traits = new Map<string, number[]>(); const simHeaders = similarity[0]; const simName = column(simHeaders, "first last name");
  for (const row of similarity.slice(1)) { const name = resolve(row[simName] || ""); if (!name || !oldNames.includes(name)) continue; traits.set(name, row.slice(simName + 1, simName + 5).map(Number)); }
  const feedbackByNew = new Map<string, Map<string, number[]>>(); const feedbackHeaders = feedback[0]; const feedbackName = column(feedbackHeaders, "first last name"); const feedbackDate = column(feedbackHeaders, "who did you go on a sister date with"); const pledge = column(feedbackHeaders, "pledge class");
  for (const row of feedback.slice(1)) { if (key(row[pledge] || "") !== "pc 29") continue; const newer = resolve(row[feedbackName] || ""), older = resolve(row[feedbackDate] || ""); if (!newer || !older || !newNames.includes(newer) || !oldNames.includes(older)) continue; if (!feedbackByNew.has(newer)) feedbackByNew.set(newer, new Map()); const personScores = feedbackByNew.get(newer)!; if (!personScores.has(older)) personScores.set(older, []); personScores.get(older)?.push(score(row, feedbackHeaders)); }
  const oldLoad = new Map(oldNames.map((name) => [name, 0])); const recommendations: PairingRecommendation[] = [];
  for (const newer of newNames) { const scoredDates = feedbackByNew.get(newer) || new Map<string, number[]>(); const bases = [...scoredDates.entries()].map(([name, values]) => ({ name, value: values.reduce((sum: number, current: number) => sum + current, 0) / values.length })).sort((a, b) => b.value - a.value).slice(0, 3);
    const preferenceValues: number[] = bases.length > 1 ? bases.flatMap((base, index) => bases.slice(index + 1).map((other) => cosine(traits.get(base.name) || [], traits.get(other.name) || []))) : []; const preference = preferenceValues.length ? preferenceValues.reduce((sum: number, value: number) => sum + value, 0) / preferenceValues.length : .5;
    const candidates = oldNames.filter((older) => !hardNos.has(`${newer}|${older}`) && !history.get(newer)?.has(older)).map((older) => { const similarityScore = bases.length ? Math.max(...bases.map((base) => preference > .55 ? cosine(traits.get(older) || [], traits.get(base.name) || []) : 1 - cosine(traits.get(older) || [], traits.get(base.name) || []))) : .5; const feedbackScore = bases.length ? bases.reduce((sum, base) => sum + base.value, 0) / bases.length : .5; return { name: older, score: similarityScore * .7 + feedbackScore * .3, mandatory: mandatory.has(`${newer}|${older}`), reason: bases.length ? `${preference > .55 ? "Similar" : "Complementary"} to ${bases.map((base) => base.name).join(", ")}, whose previous dates were rated highly.` : "No scored prior dates yet, so this is a balanced first recommendation." }; }).sort((a, b) => Number(b.mandatory) - Number(a.mandatory) || b.score - a.score || (oldLoad.get(a.name) || 0) - (oldLoad.get(b.name) || 0));
    const picks = candidates.filter((candidate) => candidate.mandatory).slice(0, 3); for (const candidate of candidates) if (picks.length < 2 && !picks.some((pick) => pick.name === candidate.name)) picks.push(candidate); if (picks.length === 2 && candidates[2] && candidates[2].score >= .7) picks.push(candidates[2]); picks.forEach((pick) => oldLoad.set(pick.name, (oldLoad.get(pick.name) || 0) + 1));
    recommendations.push({ newMember: newer, matches: picks, notes: [`${history.get(newer)?.size || 0} prior dates excluded to encourage new connections.`, `${hardNos.size ? "Hard no entries were excluded." : "No hard no entry was found for this member."}`, picks.some((pick) => pick.mandatory) ? "Requested dates are included as mandatory." : "No mandatory request was recorded." ] });
  }
  return recommendations;
}
