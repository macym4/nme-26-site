import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { isAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  const authenticated = await isAuthenticated();

  if (authenticated) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-5xl items-center gap-10 px-6 py-12 md:grid-cols-2">
      <div className="space-y-5">
        <p className="text-sm uppercase tracking-[0.25em] text-[var(--soft-ink)]">Admin access</p>
        <h1 className="font-serif text-5xl text-[var(--ink)]">Manage your directory without touching code.</h1>
        <p className="max-w-lg text-base leading-7 text-[var(--soft-ink)]">
          Sign in to create, edit, feature, and remove profiles, update gallery images, and edit the About page.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
