"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveAssignmentMaster } from "@/app/assignment-master-actions";
import { isClassMember, specialPartnerDates, memberWeekDates, type AssignmentMember, type MasterAssignment } from "@/lib/assignment-master";
import { importWeeklyAssignments } from "@/lib/weekly-assignment-import";
import { feedbackKey } from "@/lib/pairings";

const button = "rounded-lg border border-[#dfd3d5] px-3 py-2 text-sm font-semibold disabled:opacity-50";

export function AssignmentMaster({ assignments, members: suppliedMembers, responses, feedbackAvailable, checkedAt, version, available, initialized, aliases }: {
  assignments: MasterAssignment[]; members: AssignmentMember[]; responses: string[]; feedbackAvailable: boolean;
  aliases: Record<string, string>; checkedAt: string; version: string; available: boolean; initialized: boolean;
}) {
  const router = useRouter();
  const [dates, setDates] = useState(assignments);
  const [pasteSource, setPasteSource] = useState("");
  const [pasteWeek, setPasteWeek] = useState("1");
  const [rowClass, setRowClass] = useState("PC 25");
  const [query, setQuery] = useState("");
  const [extraWeeks, setExtraWeeks] = useState<number[]>([]);
  const [specialName, setSpecialName] = useState("");
  const [addedMembers, setAddedMembers] = useState<AssignmentMember[]>([]);
  const members = [...suppliedMembers, ...addedMembers.filter((added) => !suppliedMembers.some((member) => member.name === added.name))];
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const responseKeys = new Set(responses);
  const weeks = [...new Set([1, 2, 3, 4, 5, 6, ...dates.map((date) => date.week), ...extraWeeks])].sort((a, b) => a - b);
  const rows = members.filter((member) => member.pledgeClass === rowClass && member.name.toLowerCase().includes(query.toLowerCase()));
  const specialDates = specialPartnerDates(dates, members);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => {
    if (dirty) return;
    const timer = window.setInterval(() => router.refresh(), 60000);
    return () => window.clearInterval(timer);
  }, [dirty, router]);

  function change(next: MasterAssignment[]) { setDates(next); setDirty(true); setMessage(""); }
  function status(name: string, partner: string) {
    if (!isClassMember(members.find((member) => member.name === name)) && !responseKeys.has(feedbackKey(name, partner))) return "Special partner · no account required";
    return !feedbackAvailable ? "Status unavailable" : responseKeys.has(feedbackKey(name, partner)) ? "Response received" : "No response yet";
  }
  function save(next = dates) {
    startTransition(async () => {
      try {
        const result = await saveAssignmentMaster(next, version);
        if (result.error) { setMessage(result.error); return; }
        setDirty(false);
        setDates(next);
        setPasteSource("");
        setMessage("Assignments saved.");
        router.refresh();
      } catch { setMessage("Could not reach the server. Your edits are still here; try saving again."); }
    });
  }

  return <section className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-serif text-2xl font-semibold text-[#4a3036]">Master assignment sheet</h2><p className="mt-1 text-sm text-[#806d72]">{dates.length} dates · Changes apply to both class views when saved.</p></div>
      <div className="flex flex-wrap gap-2"><button type="button" className={button} disabled={pending || !dirty} onClick={() => { setDates(assignments); setDirty(false); setMessage(""); }}>Discard edits</button><button type="button" className={`${button} bg-[#7d1d2b] text-white`} disabled={pending || !available || (!dirty && initialized)} onClick={() => save()}>{pending ? "Saving…" : "Save master sheet"}</button></div>
    </div>
    {!initialized && available && <p className="rounded-lg bg-[#fcf5f6] p-3 text-sm text-[#604a50]">Existing assignments from both Google summary tabs and the site are included below. Your first save makes this page the master for assignments. Form responses will continue updating from Google Sheets.</p>}
    {!available && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">The existing Google assignments could not be loaded. Only saved site dates are shown. Editing is disabled until the full sheet can be loaded.</p>}
    <fieldset disabled={pending || !available} className="space-y-3 rounded-xl border border-[#dfd3d5] bg-white p-4">
      <legend className="px-2 font-semibold text-[#604a50]">Paste this week&apos;s dates</legend>
      <label className="block text-sm font-semibold">Week <input aria-label="Week for pasted dates" type="number" min={1} max={52} value={pasteWeek} onChange={(event) => setPasteWeek(event.target.value)} className="ml-2 w-20 rounded-lg border border-[#dfd3d5] p-2" /></label>
      <label className="block text-sm font-semibold">Weekly pairings<textarea value={pasteSource} onChange={(event) => setPasteSource(event.target.value)} placeholder={"Member\tPartner 1\tPartner 2"} className="mt-2 min-h-36 w-full rounded-lg border border-[#dfd3d5] p-3 font-mono text-sm" /></label>
      <p className="text-sm text-[#806d72]">Copy the member and partner columns for one week. Each row can include multiple partners. Tabs, commas, semicolons, and Markdown tables are supported. Dates are added to the selected week; existing dates are kept and duplicates are skipped.</p>
      <button type="button" disabled={!pasteSource.trim() || pending || !available} className={`${button} bg-[#7d1d2b] text-white`} onClick={() => {
        try { save(importWeeklyAssignments(pasteSource, Number(pasteWeek), dates, aliases)); }
        catch (error) { setMessage(error instanceof Error ? error.message : "Could not read those dates."); }
      }}>{pending ? "Assigning..." : "Assign dates"}</button>
      <p className="text-xs text-[#806d72]">Assign dates saves directly into the table, including any edits below. Each person&apos;s feedback status fills in automatically from submitted forms.</p>
    </fieldset>
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex gap-2" aria-label="Class shown as rows">{["PC 25", "PC 26"].map((value) => <button key={value} type="button" aria-pressed={rowClass === value} onClick={() => setRowClass(value)} className={`${button} ${rowClass === value ? "bg-[#7d1d2b] text-white" : "bg-white"}`}>{value} as rows</button>)}</div>
      <label className="text-sm font-semibold">Find a member<input value={query} onChange={(event) => setQuery(event.target.value)} className="ml-2 rounded-lg border border-[#dfd3d5] px-3 py-2" placeholder="Search name" /></label>
      <button type="button" className={button} disabled={weeks[weeks.length - 1] >= 52} onClick={() => setExtraWeeks([...extraWeeks, weeks[weeks.length - 1] + 1])}>Add week</button>
    </div>
    <div className="flex flex-wrap items-center gap-3 text-xs text-[#806d72]"><p>{feedbackAvailable ? `Feedback checked ${new Date(checkedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.` : "Feedback sheet unavailable. Response status is unknown."} Refreshes every minute while there are no unsaved edits.</p><button type="button" disabled={dirty || pending} className="font-bold underline disabled:opacity-50" onClick={() => router.refresh()}>Refresh feedback</button></div>
    <p className="text-xs text-[#806d72]">Response status is per person and partner, across all weeks. Repeat dates show the same response status.</p>
    {(message || dirty) && <p role="status" className="rounded-lg bg-[#fcf5f6] p-3 text-sm font-semibold text-[#7d1d2b]">{message || "Unsaved changes"}</p>}
    <fieldset disabled={pending || !available} className="min-w-0">
      <div className="max-h-[72vh] overflow-auto rounded-xl border border-[#dfd3d5] bg-white">
        <table className="w-full border-separate border-spacing-0 text-left text-sm">
          <caption className="sr-only">Sister date assignments with {rowClass} members as rows and weeks as columns</caption>
          <thead className="sticky top-0 z-20"><tr><th scope="col" className="sticky left-0 z-30 min-w-48 border-b border-r border-[#dfd3d5] bg-[#f4e5e7] p-4">{rowClass} member</th>{weeks.map((week) => <th key={week} scope="col" className="min-w-72 border-b border-r border-[#dfd3d5] bg-[#fcf5f6] p-4">Week {week}<span className="ml-2 text-xs font-normal text-[#806d72]">{dates.filter((date) => date.week === week).length} dates total</span></th>)}</tr></thead>
          <tbody>{rows.map((member) => <tr key={member.name}><th scope="row" className="sticky left-0 z-10 border-b border-r border-[#dfd3d5] bg-[#fffafa] p-4 align-top"><p>{member.name}</p><p className="mt-1 text-xs font-normal text-[#806d72]">{dates.filter((date) => date.memberOne === member.name || date.memberTwo === member.name).length} assigned dates</p></th>{weeks.map((week) => {
            const matches = memberWeekDates(dates, member.name, week);
            return <td key={week} className="border-b border-r border-[#eadfe1] p-3 align-top"><div className="space-y-3">{matches.length ? matches.map((date) => <article key={date.index} className="rounded-lg border border-[#eadfe1] bg-[#fcf8f8] p-3">
              <label className="block text-xs font-semibold text-[#604a50]">Partner<select aria-label={`Partner for ${member.name}, week ${week}, date ${matches.indexOf(date) + 1}`} value={date.partner} onChange={(event) => change(dates.map((item, index) => index === date.index ? { ...item, ...(item.memberOne === member.name ? { memberTwo: event.target.value } : { memberOne: event.target.value }) } : item))} className="mt-1 w-full rounded-md border border-[#dfd3d5] bg-white p-2 text-sm">{members.filter((item) => item.name !== member.name).map((item) => <option key={item.name} value={item.name}>{item.name}{isClassMember(item) ? ` · ${item.pledgeClass}` : " · Special partner"}</option>)}</select></label>
              <p className={`mt-2 text-xs ${feedbackAvailable && responseKeys.has(feedbackKey(member.name, date.partner)) ? "text-green-800" : "text-[#806d72]"}`}>{member.name}: {status(member.name, date.partner)}</p>
              <p className={`mt-1 text-xs ${feedbackAvailable && responseKeys.has(feedbackKey(date.partner, member.name)) ? "text-green-800" : "text-[#806d72]"}`}>{date.partner}: {status(date.partner, member.name)}</p>
              <button type="button" className="mt-2 text-xs font-semibold text-[#7d1d2b] underline" aria-label={`Remove ${member.name} and ${date.partner} in week ${week}`} onClick={() => change(dates.filter((_, index) => index !== date.index))}>Remove date</button>
            </article>) : <p className="text-xs text-[#9a858a]">No dates assigned</p>}
              <select aria-label={`Add partner for ${member.name} in week ${week}`} value="" onChange={(event) => { if (event.target.value) change([...dates, { memberOne: member.name, memberTwo: event.target.value, week }]); }} className="w-full rounded-lg border border-dashed border-[#d9c6cb] bg-white p-2 text-xs text-[#7d1d2b]"><option value="">+ Assign a date</option>{members.filter((item) => item.name !== member.name && !matches.some((date) => date.partner === item.name)).map((item) => <option key={item.name} value={item.name}>{item.name}{isClassMember(item) ? ` · ${item.pledgeClass}` : " · Special partner"}</option>)}</select>
            </div></td>;
          })}</tr>)}</tbody>
        </table>
        {!rows.length && <p className="p-5 text-sm text-[#806d72]">No members match this view.</p>}
      </div>
      <div className="mt-5 rounded-xl border border-[#dfd3d5] bg-white p-4">
        <h3 className="font-serif text-xl font-semibold text-[#4a3036]">Special partner dates</h3>
        <p className="mt-1 text-sm text-[#806d72]">Partners outside PC 25 and PC 26 do not need accounts. Track the assigned member’s form response here, in either class view.</p>
        <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="bg-[#fcf5f6]"><th scope="col" className="p-3">Week</th><th scope="col" className="p-3">Member</th><th scope="col" className="p-3">Special partner</th><th scope="col" className="p-3">Member’s form</th><th scope="col" className="p-3"><span className="sr-only">Actions</span></th></tr></thead><tbody>{specialDates.map((date) => <tr key={date.index} className="border-b border-[#eadfe1]"><td className="p-3">{date.week}</td><th scope="row" className="p-3 font-semibold">{date.member}</th><td className="p-3">{date.partner}</td><td className="p-3">{date.hasClassMember ? status(date.member, date.partner) : "No PC 25 / PC 26 member on this date"}</td><td className="p-3"><button type="button" className="text-xs font-semibold text-[#7d1d2b] underline" aria-label={`Remove special date for ${date.member} with ${date.partner} in week ${date.week}`} onClick={() => change(dates.filter((_, index) => index !== date.index))}>Remove date</button></td></tr>)}</tbody></table>{!specialDates.length && <p className="p-3 text-sm text-[#806d72]">No special partner dates assigned yet.</p>}</div>
        <div className="mt-4 flex flex-wrap items-end gap-2"><label className="text-sm font-semibold text-[#604a50]">Add a special partner<input value={specialName} onChange={(event) => setSpecialName(event.target.value)} maxLength={150} placeholder="Full name" className="ml-2 rounded-lg border border-[#dfd3d5] p-2" /></label><button type="button" className={button} disabled={!specialName.trim()} onClick={() => {
          const name = specialName.trim();
          if (!members.some((member) => feedbackKey(member.name, "") === feedbackKey(name, ""))) setAddedMembers([...addedMembers, { name, pledgeClass: "" }]);
          setSpecialName("");
          setMessage(`${name} is available in the partner menus. Assign a date above, then save.`);
        }}>Add to partner menus</button></div>
      </div>
    </fieldset>
  </section>;
}
