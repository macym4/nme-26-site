import type { ReactNode } from "react";

function inlineFormat(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*")) return <em key={index}>{part.slice(1, -1)}</em>;
    return part;
  });
}

export function AnnouncementBody({ body }: { body: string }) {
  const lines = body.split(/\r?\n/);
  const content: ReactNode[] = [];
  let bullets: ReactNode[] = [];
  const flushBullets = () => { if (bullets.length) { content.push(<ul key={`list-${content.length}`} className="list-disc space-y-1 pl-5">{bullets}</ul>); bullets = []; } };
  lines.forEach((line, index) => { const bullet = line.match(/^[-*]\s+(.+)/); if (bullet) { bullets.push(<li key={index}>{inlineFormat(bullet[1])}</li>); return; } flushBullets(); if (line.trim()) content.push(<p key={index}>{inlineFormat(line)}</p>); });
  flushBullets();
  return <div className="space-y-2 text-sm leading-6 text-[#655258]">{content}</div>;
}
