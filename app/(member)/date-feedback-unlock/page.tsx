import { DateFeedbackUnlockForm } from "@/components/date-feedback/unlock-form";
import { NmePage } from "@/components/nme/page";
import { requireUserAdmin } from "@/lib/auth";

export default async function DateFeedbackUnlock() {
  await requireUserAdmin();

  return <NmePage title="Date Feedback Results" subtitle="Enter the separate confidential-results password to continue."><DateFeedbackUnlockForm /></NmePage>;
}
