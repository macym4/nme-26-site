import { createProfileAction } from "@/app/actions";
import { ProfileEditor } from "@/components/admin/profile-editor";

export default function NewProfilePage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--soft-ink)]">New profile</p>
        <h2 className="font-serif text-4xl text-[var(--ink)]">Create a new profile</h2>
      </div>
      <ProfileEditor action={createProfileAction} />
    </div>
  );
}
