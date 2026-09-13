import { redirect } from "next/navigation";
import { changeRequiredPassword } from "@/app/password-actions";
import { userLogoutAction } from "@/app/actions";
import { PasswordForm } from "@/components/auth/password-form";
import { getUserSessionId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const id = await getUserSessionId(true);
  if (!id) redirect("/");
  const user = await prisma.user.findUnique({ where: { id }, select: { mustChangePassword: true } });
  if (!user?.mustChangePassword) redirect("/welcome");
  return <main className="mx-auto max-w-md px-6 py-16"><h1 className="mb-6 font-serif text-4xl text-[#6f1935]">Choose your password</h1><PasswordForm action={changeRequiredPassword} /><form action={userLogoutAction} className="mt-6"><button className="text-sm text-[#6f1935] underline">Sign out</button></form></main>;
}
