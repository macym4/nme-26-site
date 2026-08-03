import { logoutAction } from "@/app/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <SubmitButton label="Log out" pendingLabel="Logging out..." />
    </form>
  );
}
