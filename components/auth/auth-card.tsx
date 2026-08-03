"use client";

import { useState } from "react";
import { useActionState } from "react";

import { registerUserAction, userLoginAction } from "@/app/actions";

const GoogleIcon = () => (
  <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.5a4.7 4.7 0 0 1-2 3.1v2.5h3.3c1.9-1.8 3-4.3 3-7.4Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2.1 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3a10 10 0 0 0 0 9l3.4-2.6Z" />
    <path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 3.9 1.5l2.9-2.9A10 10 0 0 0 3 7.5l3.4 2.6C7.2 7.7 9.4 5.9 12 5.9Z" />
  </svg>
);

export function AuthCard() {
  const [isSignIn, setIsSignIn] = useState(false);
  const [registerState, registerAction, registering] = useActionState(registerUserAction, {});
  const [loginState, loginAction, loggingIn] = useActionState(userLoginAction, {});
  const state = isSignIn ? loginState : registerState;

  return (
    <div className="mx-auto max-w-md">
      <p className="text-sm font-medium text-[#6c6890]">{isSignIn ? "Welcome back" : "Let’s get started"}</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#24213f]">
        {isSignIn ? "Sign in to your account" : "Create your account"}
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#77738f]">
        {isSignIn ? "Enter your details to pick up where you left off." : "It only takes a minute to join us."}
      </p>

      <form className="mt-7 space-y-4" action={isSignIn ? loginAction : registerAction}>
        {state.errors?.form && <p className="rounded-xl bg-[#fff0ef] px-3 py-2 text-sm text-[#a33e35]">{state.errors.form}</p>}
        {!isSignIn && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name" name="name" placeholder="Jane Doe" autoComplete="name" error={state.errors?.name} />
            <Field label="Phone number" name="phone" placeholder="(555) 000-0000" type="tel" autoComplete="tel" error={state.errors?.phone} />
          </div>
        )}
        <Field label="Email address" name="email" placeholder="you@example.com" type="email" autoComplete="email" error={state.errors?.email} />
        <Field label="Password" name="password" placeholder="Create a password" type="password" autoComplete={isSignIn ? "current-password" : "new-password"} error={state.errors?.password} />
        {!isSignIn && <p className="-mt-1 text-xs text-[#88849f]">Use at least 8 characters with a mix of letters and numbers.</p>}
        <button className="w-full rounded-xl bg-[#312e62] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(49,46,98,.22)] transition hover:bg-[#403d7d] disabled:opacity-60" type="submit" disabled={isSignIn ? loggingIn : registering}>
          {isSignIn ? (loggingIn ? "Signing in…" : "Sign in") : (registering ? "Creating account…" : "Create account")}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-[#a09db1]"><span className="h-px flex-1 bg-[#e6e4ed]" />or continue with<span className="h-px flex-1 bg-[#e6e4ed]" /></div>
      <button className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-[#dedce7] bg-white px-4 py-3 text-sm font-semibold text-[#393650] opacity-65" type="button" disabled title="Google sign-in is not configured yet">
        <GoogleIcon /> Continue with Google
      </button>
      <p className="mt-7 text-center text-sm text-[#77738f]">
        {isSignIn ? "New here?" : "Already have an account?"}{" "}
        <button className="font-semibold text-[#393572] hover:underline" type="button" onClick={() => setIsSignIn(!isSignIn)}>
          {isSignIn ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

function Field({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return <label className="block text-sm font-medium text-[#454160]"><span>{label}</span><input className="mt-2 w-full rounded-xl border border-[#dedce7] bg-white px-3.5 py-3 text-sm text-[#24213f] outline-none transition placeholder:text-[#aaa6b8] focus:border-[#706bb8] focus:ring-4 focus:ring-[#e9e7fb]" required {...props} />{error && <span className="mt-1 block text-xs font-normal text-[#a33e35]">{error}</span>}</label>;
}
