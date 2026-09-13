"use client";

import { useMemo, useState } from "react";

type Member = { id: string; name: string; pledgeClass: string | null };
type Assignment = { memberOne: string; memberTwo: string; week: number };

function messageFor(template: string, name: string, dates: string[]) {
  let message = template.replaceAll("[RECIPIENT NAME]", name);
  if (!dates[2]) message = message.replace(/,?\s*(and\s+)?\[DATE NAME #3\]/gi, "");
  if (!dates[1]) message = message.replace(/,?\s*(and\s+)?\[DATE NAME #2\]/gi, "");
  return dates.reduce((result, date, index) => result.replaceAll(`[DATE NAME #${index + 1}]`, date), message)
    .replace(/\[DATE NAME #\d\]/g, "").replace(/[ \t]+\n/g, "\n").trim();
}

export function DraftTextMessages({ members, assignments }: { members: Member[]; assignments: Assignment[] }) {
  const [pledgeClass, setPledgeClass] = useState("PC 25");
  const [template, setTemplate] = useState("Hi [RECIPIENT NAME]!\n\nHere are your sister dates:\n[DATE NAME #1]\n[DATE NAME #2]\n[DATE NAME #3]");
  const [copied, setCopied] = useState("");
  const [generated, setGenerated] = useState(false);
  const drafts = useMemo(() => members.filter((member) => member.pledgeClass?.trim().toLowerCase() === pledgeClass.toLowerCase()).map((member) => {
    const dates = assignments.filter((assignment) => assignment.memberOne === member.name || assignment.memberTwo === member.name).sort((a, b) => a.week - b.week).map((assignment) => assignment.memberOne === member.name ? assignment.memberTwo : assignment.memberOne).slice(0, 3);
    return { name: member.name, text: messageFor(template, member.name, dates) };
  }), [assignments, members, pledgeClass, template]);

  async function copy(text: string, key: string) { await navigator.clipboard.writeText(text); setCopied(key); }

  return <div className="space-y-4"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { setPledgeClass("PC 25"); setGenerated(false); }} className={`rounded-lg px-3 py-2 text-sm font-bold ${pledgeClass === "PC 25" ? "bg-[#7d1d2b] text-white" : "bg-[#f4e5e7] text-[#7d1d2b]"}`}>PC 25</button><button type="button" onClick={() => { setPledgeClass("PC 26"); setGenerated(false); }} className={`rounded-lg px-3 py-2 text-sm font-bold ${pledgeClass === "PC 26" ? "bg-[#7d1d2b] text-white" : "bg-[#f4e5e7] text-[#7d1d2b]"}`}>PC 26</button></div><label className="block text-sm font-semibold text-[#604a50]">Message template<textarea value={template} onChange={(event) => { setTemplate(event.target.value); setGenerated(false); }} className="mt-1.5 min-h-40 w-full rounded-lg border border-[#dfd3d5] bg-white p-3 font-mono text-sm font-normal" /></label><p className="text-xs leading-5 text-[#806d72]">Use [RECIPIENT NAME], [DATE NAME #1], [DATE NAME #2], and [DATE NAME #3]. If a member has fewer dates, unused date placeholders and their list wording are removed.</p><button type="button" onClick={() => setGenerated(true)} className="rounded-lg bg-[#7d1d2b] px-4 py-2.5 text-sm font-bold text-white">Generate copy-paste messages</button>{generated && <div className="space-y-3">{drafts.length ? drafts.map((draft) => <article key={draft.name} className="rounded-xl bg-[#fcf5f6] p-4"><div className="flex items-center justify-between gap-3"><p className="font-bold text-[#4a3036]">{draft.name}</p><button type="button" onClick={() => void copy(draft.text, draft.name)} className="rounded-lg border border-[#7d1d2b] px-3 py-1.5 text-xs font-bold text-[#7d1d2b]">{copied === draft.name ? "Copied" : "Copy message"}</button></div><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#655258]">{draft.text}</p></article>) : <p className="rounded-xl bg-[#fcf5f6] p-4 text-sm text-[#806d72]">No members are assigned to {pledgeClass} yet. Add a pledge class to member profiles first.</p>}</div>}</div>;
}
