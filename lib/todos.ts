import { prisma } from "@/lib/prisma";

const defaults = [
  { key: "profile", label: "PC 25/26 Profiles", href: "https://forms.gle/U1PHyTbuBbkJxcfq6", sortOrder: 1 },
  { key: "billhighway", label: "Create Billhighway account", href: null, sortOrder: 2 },
  { key: "dues", label: "Pay 2026–2027 Dues", href: null, sortOrder: 3 },
];

export async function getTodoTasks() {
  await Promise.all(defaults.map((task) => prisma.todoTask.upsert({ where: { key: task.key }, update: {}, create: task })));
  return prisma.todoTask.findMany({ orderBy: { sortOrder: "asc" } });
}
