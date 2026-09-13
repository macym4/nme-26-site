export type Pairing = { id: string; one: string; two: string };

export function parsePairings(text: string): Pairing[] {
  const pairs: Pairing[] = [];
  for (const line of text.split(/\r?\n/)) {
    const markdown = line.trim().startsWith("|");
    const delimiter = markdown ? "|" : line.includes("\t") ? "\t" : line.includes(";") ? ";" : ",";
    const cells: string[] = [];
    let cell = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' && quoted && line[i + 1] === '"') { cell += '"'; i++; }
      else if (char === '"') quoted = !quoted;
      else if (char === delimiter && !quoted) { cells.push(cell.trim()); cell = ""; }
      else cell += char;
    }
    cells.push(cell.trim());
    if (markdown) { cells.shift(); if (!cells[cells.length - 1]) cells.pop(); }
    const [one, ...partners] = cells.map((value) => value.replace(/^\*\*|\*\*$/g, "").trim());
    if (!one || /^:?-+:?$/.test(one) || /^(pc\s*\d+|name(?: one)?|member(?: one)?)$/i.test(one)) continue;
    for (const two of partners.filter(Boolean)) pairs.push({ id: `pair-${pairs.length}`, one, two });
  }
  return pairs;
}

export function movePairing(pairs: Pairing[], sourceId: string, targetId: string): Pairing[] {
  const from = pairs.findIndex((pair) => pair.id === sourceId);
  const to = pairs.findIndex((pair) => pair.id === targetId);
  if (from < 0 || to < 0 || from === to) return pairs;
  const next = [...pairs];
  const [pair] = next.splice(from, 1);
  next.splice(to, 0, pair);
  return next;
}
