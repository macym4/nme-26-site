"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function FeedbackRefresh({ available }: { available: boolean }) {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === "visible") router.refresh(); };
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [router]);
  return <p className="mb-4 text-sm text-[#806d72]" role="status">{available ? "Feedback status refreshes every minute." : "Feedback sheet unavailable. Showing saved progress; recent submissions may not appear yet."}</p>;
}
