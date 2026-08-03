"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-24">
      <div className="rounded-[2rem] border border-[#f0b0a9] bg-[#fff2ef] p-8">
        <h1 className="font-serif text-3xl text-[#8f3125]">Something went wrong</h1>
        <p className="mt-3 text-sm text-[#8f3125]">{error.message || "An unexpected error occurred."}</p>
        <button
          className="mt-6 rounded-full bg-[#8f3125] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => reset()}
          type="button"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
