"use client";
import { useEffect } from "react";
export function ConsumeDateFeedbackAccess() { useEffect(() => { void fetch("/api/date-feedback-access", { method: "DELETE" }); }, []); return null; }
