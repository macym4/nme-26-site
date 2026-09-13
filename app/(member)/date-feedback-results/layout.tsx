import { redirect } from "next/navigation";
import { hasDateFeedbackAccess, requireUserAdmin } from "@/lib/auth";
export default async function DateFeedbackLayout({ children }: { children: React.ReactNode }) {
  await requireUserAdmin();
  if (!await hasDateFeedbackAccess()) redirect("/date-feedback-unlock");
  return <>{children}</>;
}
