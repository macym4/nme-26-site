import { readFile } from "node:fs/promises";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const calendarUserEmail = "calendar@aphi.local";

type CalendarEvent = {
  uid: string;
  recurrenceId?: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: Date;
  endsAt: Date;
  rrule?: string;
};

function unfoldIcs(contents: string) {
  return contents.replace(/\r?\n[ \t]/g, "").split(/\r?\n/);
}

function unescapeIcs(value = "") {
  return value.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

function parseDate(value: string, dateOnly = false) {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?(Z)?$/);
  if (!match) throw new Error(`Unsupported calendar date: ${value}`);

  const [, year, month, day, hour = "00", minute = "00", second = "00", utc] = match;
  if (dateOnly || !match[4]) return new Date(Number(year), Number(month) - 1, Number(day));
  if (utc) return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
}

function parseEvents(contents: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  let fields: Record<string, { value: string; params: string }> | undefined;

  for (const line of unfoldIcs(contents)) {
    if (line === "BEGIN:VEVENT") {
      fields = {};
      continue;
    }
    if (line === "END:VEVENT" && fields) {
      const start = fields.DTSTART;
      const end = fields.DTEND;
      if (start && end && fields.UID && fields.SUMMARY) {
        events.push({
          uid: fields.UID.value,
          recurrenceId: fields["RECURRENCE-ID"]?.value,
          title: unescapeIcs(fields.SUMMARY.value),
          description: unescapeIcs(fields.DESCRIPTION?.value),
          location: unescapeIcs(fields.LOCATION?.value),
          startsAt: parseDate(start.value, start.params.includes("VALUE=DATE")),
          endsAt: parseDate(end.value, end.params.includes("VALUE=DATE")),
          rrule: fields.RRULE?.value,
        });
      }
      fields = undefined;
      continue;
    }
    if (!fields) continue;

    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const [name, ...params] = line.slice(0, separator).split(";");
    fields[name] = { value: line.slice(separator + 1), params: params.join(";") };
  }
  return events;
}

function expandWeekly(event: CalendarEvent) {
  if (!event.rrule) return [event];
  const rule = Object.fromEntries(event.rrule.split(";").map((part) => part.split("=")));
  if (rule.FREQ !== "WEEKLY") throw new Error(`Unsupported recurrence rule: ${event.rrule}`);

  const until = rule.UNTIL ? parseDate(rule.UNTIL) : undefined;
  const count = rule.COUNT ? Number(rule.COUNT) : undefined;
  const duration = event.endsAt.getTime() - event.startsAt.getTime();
  const occurrences: CalendarEvent[] = [];

  for (let index = 0; !count || index < count; index += 1) {
    const startsAt = new Date(event.startsAt);
    startsAt.setDate(startsAt.getDate() + index * 7);
    if (until && startsAt > until) break;
    occurrences.push({ ...event, startsAt, endsAt: new Date(startsAt.getTime() + duration), rrule: undefined });
  }
  return occurrences;
}

async function main() {
  const filename = process.argv[2];
  if (!filename) throw new Error("Usage: npm run import-calendar -- <calendar.ics>");

  const contents = await readFile(filename, "utf8");
  const parsed = parseEvents(contents);
  const overrides = new Map(parsed.filter((event) => event.recurrenceId).map((event) => [`${event.uid}:${parseDate(event.recurrenceId!).toISOString()}`, event]));
  const expanded = parsed.flatMap((event) => event.recurrenceId ? [event] : expandWeekly(event));
  const unique = new Map<string, CalendarEvent>();

  for (const event of expanded) {
    const key = `${event.uid}:${event.startsAt.toISOString()}`;
    const override = overrides.get(key);
    unique.set(key, override ?? event);
  }

  const calendarUser = await prisma.user.upsert({
    where: { email: calendarUserEmail },
    update: {},
    create: {
      name: "APhi Shared Calendar",
      email: calendarUserEmail,
      phone: "",
      passwordHash: "calendar-import-account",
      role: "admin",
      accessStatus: "approved",
    },
  });

  await prisma.calendarItem.deleteMany({ where: { userId: calendarUser.id } });
  await prisma.calendarItem.createMany({
    data: [...unique.values()].map((event) => ({
      userId: calendarUser.id,
      title: event.title,
      type: "event",
      dueAt: event.startsAt,
      durationMinutes: Math.round((event.endsAt.getTime() - event.startsAt.getTime()) / 60_000),
      location: event.location || null,
      notes: event.description || null,
    })),
  });

  console.log(`Imported ${unique.size} events from ${filename}.`);
}

main()
  .finally(async () => prisma.$disconnect());
