"use client";

import { useActionState, useState } from "react";

import { registerUserAction, userLoginAction } from "@/app/actions";
import { prepareProfilePhoto } from "@/lib/profile-photo-client";
import type { ProfileFormState } from "@/types";

async function registerWithPhoto(previous: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const photo = formData.get("profileImage");
  if (photo instanceof File && photo.size > 0) {
    try { formData.set("profileImage", await prepareProfilePhoto(photo)); }
    catch (error) { return { errors: { form: error instanceof Error ? error.message : "Unable to prepare your photo." } }; }
  }
  return registerUserAction(previous, formData);
}

export function AuthCard() {
  const [isSignIn, setIsSignIn] = useState(false);
  const [registerState, registerAction, registering] = useActionState(registerWithPhoto, {});
  const [loginState, loginAction, loggingIn] = useActionState(userLoginAction, {});
  const state = isSignIn ? loginState : registerState;

  return <div className="max-w-md"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#6f1935]">{isSignIn ? "Welcome back" : "Let's get started!"}</p><h1 className="mt-3 font-serif text-5xl font-semibold leading-[.9] tracking-tight text-[#302a2e]">{isSignIn ? "Sign in to Alpha Phi" : "Join the APhi new member hub"}</h1><p className="mt-5 text-[15px] leading-7 text-[#675f64]">{isSignIn ? "Enter your details to access NME resources, schedules, and reminders." : "Create your account to access NME resources, schedules, and reminders."}</p>
    <form className="mt-8 space-y-4" action={isSignIn ? loginAction : registerAction}>
      {state.errors?.form && <p className="border-l-4 border-[#6f1935] bg-[#f7ecef] px-3 py-2 text-sm text-[#861d3e]">{state.errors.form}</p>}
      {!isSignIn && <><div className="grid gap-4 sm:grid-cols-2"><Field label="Your name" name="name" placeholder="Jane Doe" autoComplete="name" error={state.errors?.name} /><Field label="Phone number" name="phone" placeholder="(555) 000-0000" type="tel" autoComplete="tel" error={state.errors?.phone} /></div><label className="block text-sm font-medium text-[#4d454a]"><span>Profile photo <span className="font-normal text-[#81787d]">(optional)</span></span><input className="mt-2 block w-full text-sm text-[#4d454a] file:mr-3 file:border-0 file:bg-[#e5e2e3] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#6f1935]" name="profileImage" type="file" accept="image/*" /><span className="mt-1 block text-xs font-normal text-[#81787d]">Choose a photo up to 5 MB. We automatically resize it for your profile.</span></label></>}
      <Field label="Email address" name="email" placeholder="you@example.com" type="email" autoComplete="email" error={state.errors?.email} />
      <Field label="Password" name="password" placeholder={isSignIn ? "Enter your password" : "Create a password"} type="password" autoComplete={isSignIn ? "current-password" : "new-password"} error={state.errors?.password} />
      {!isSignIn && <p className="-mt-1 text-xs text-[#81787d]">Use at least 8 characters with a mix of letters and numbers.</p>}
      <button className="w-full bg-[#6f1935] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#4d1025] disabled:opacity-60" type="submit" disabled={isSignIn ? loggingIn : registering}>{isSignIn ? (loggingIn ? "Signing in…" : "Sign in") : (registering ? "Creating account…" : "Create account")}</button>
    </form>
    <p className="mt-8 border-t border-[#dfdcde] pt-6 text-center text-sm text-[#6b6267]">{isSignIn ? "New here?" : "Already have an account?"}{" "}<button className="font-bold text-[#6f1935] underline underline-offset-4" type="button" onClick={() => setIsSignIn(!isSignIn)}>{isSignIn ? "Create an account" : "Sign in"}</button></p>
  </div>;
}

function Field({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <label className="block text-sm font-medium text-[#4d454a]"><span>{label}</span><input className="mt-2 w-full border border-[#cfcbce] bg-white px-3.5 py-3 text-sm text-[#292629] outline-none transition placeholder:text-[#aaa3a7] focus:border-[#6f1935] focus:ring-2 focus:ring-[#e5d4db]" required {...props} />{error && <span className="mt-1 block text-xs font-normal text-[#9c2547]">{error}</span>}</label>;
}
