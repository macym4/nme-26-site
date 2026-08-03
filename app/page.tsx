import { AuthCard } from "@/components/auth/auth-card";

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 py-10 sm:px-8">
      <div className="pointer-events-none absolute -left-24 top-[-4rem] h-72 w-72 rounded-full bg-[#dcd5ff] blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-[-3rem] h-80 w-80 rounded-full bg-[#c8f2e1] blur-3xl" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/80 shadow-[0_30px_90px_rgba(54,42,108,0.14)] backdrop-blur-xl lg:grid-cols-[.9fr_1.1fr]">
        <div className="hidden flex-col justify-between bg-[#312e62] p-12 text-white lg:flex">
          <div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl font-bold text-[#312e62]">a</div>
            <p className="mt-12 text-sm font-semibold uppercase tracking-[0.22em] text-[#c8c3ff]">Welcome to Aster</p>
            <h1 className="mt-4 max-w-sm text-5xl font-semibold leading-[1.08] tracking-tight">A little space to call your own.</h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-white/70">Create your account and keep the people, things, and moments that matter close.</p>
          </div>
          <p className="text-sm text-white/55">Simple, private, and made for you.</p>
        </div>
        <div className="p-6 sm:p-10 lg:p-12">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#312e62] text-lg font-bold text-white">a</div>
            <span className="text-lg font-semibold tracking-tight text-[#24213f]">Aster</span>
          </div>
          <AuthCard />
        </div>
      </section>
    </main>
  );
}
