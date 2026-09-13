"use client";

import { useActionState, useRef, useState } from "react";

import { createAnnouncementAction } from "@/app/actions";

export function AnnouncementComposer() {
  const [state, action, pending] = useActionState(createAnnouncementAction, {});
  const [body, setBody] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);

  function insert(before: string, after = before, fallback = "text") {
    const field = textarea.current;
    if (!field) return;
    const start = field.selectionStart; const end = field.selectionEnd; const selected = body.slice(start, end) || fallback;
    const next = `${body.slice(0, start)}${before}${selected}${after}${body.slice(end)}`;
    setBody(next);
    requestAnimationFrame(() => { field.focus(); field.setSelectionRange(start + before.length, start + before.length + selected.length); });
  }

  function addBullets() {
    const field = textarea.current;
    if (!field) return;
    const start = field.selectionStart; const end = field.selectionEnd; const selected = body.slice(start, end) || "List item";
    const list = selected.split("\n").map((line) => `- ${line}`).join("\n");
    setBody(`${body.slice(0, start)}${list}${body.slice(end)}`);
    requestAnimationFrame(() => field.focus());
  }

  return <form action={action} className="mt-5 rounded-xl border border-[#e6d5d8] bg-[#fff8f9] p-4"><label className="block text-sm font-bold text-[#604a50]">Announcement header<input name="title" required maxLength={120} placeholder="Chapter meeting reminder" className="mt-2 w-full rounded-lg border border-[#dfd3d5] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[#9b3b4b]" /></label><div className="mt-4"><div className="flex flex-wrap items-center gap-2 rounded-t-lg border border-b-0 border-[#dfd3d5] bg-[#f8eff1] p-2"><button type="button" onClick={() => insert("**")} className="rounded px-2 py-1 text-sm font-bold text-[#681b2d] hover:bg-white" aria-label="Bold">B</button><button type="button" onClick={() => insert("*")} className="rounded px-2 py-1 text-sm italic text-[#681b2d] hover:bg-white" aria-label="Italic">I</button><button type="button" onClick={addBullets} className="rounded px-2 py-1 text-sm text-[#681b2d] hover:bg-white" aria-label="Bullet list">• List</button><button type="button" onClick={() => insert("🌿", "", "")} className="rounded px-2 py-1 text-sm text-[#681b2d] hover:bg-white" aria-label="Insert ivy emoji">🌿</button><span className="ml-auto text-xs text-[#806d72]">Formatting appears when posted</span></div><label className="block text-sm font-bold text-[#604a50]"><span className="sr-only">Post an announcement</span><textarea ref={textarea} name="body" required maxLength={1000} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Share a chapter update…" className="min-h-28 w-full rounded-b-lg border border-[#dfd3d5] bg-white p-3 text-sm font-normal outline-none focus:border-[#9b3b4b]" /></label></div>{state.errors?.form && <p className="mt-2 text-sm text-[#9c2f3e]">{state.errors.form}</p>}{state.success && <p className="mt-2 text-sm text-[#367354]">{state.success}</p>}<button disabled={pending} className="mt-3 rounded-lg bg-[#7d1d2b] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{pending ? "Posting…" : "Post announcement"}</button></form>;
}
