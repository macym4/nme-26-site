"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type MenuItem = [string, string];

export function MemberMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeWhenClickingAway(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", closeWhenClickingAway);
    return () => document.removeEventListener("mousedown", closeWhenClickingAway);
  }, []);

  return (
    <div ref={rootRef} className="relative z-[9999] shrink-0">
      <button
        aria-expanded={open}
        className="flex items-center gap-1 whitespace-nowrap px-3 py-2 transition hover:text-[#6f1935]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {label}
        <svg aria-hidden="true" viewBox="0 0 12 12" className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="m2.5 4.25 3.5 3.5 3.5-3.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 top-full z-[9999] mt-2 min-w-56 border border-[#dedbdd] bg-white p-1.5 shadow-[0_12px_28px_rgba(74,48,54,.16)]">
          {items.map(([name, href]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm font-semibold text-[#604a50] transition hover:bg-[#f4f1ee] hover:text-[#6f1935]">
              {name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
