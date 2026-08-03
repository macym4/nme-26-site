type FormMessageProps = {
  error?: string;
  success?: string;
};

export function FormMessage({ error, success }: FormMessageProps) {
  if (!error && !success) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-sm ${
        error
          ? "border border-[#f0b0a9] bg-[#fff2ef] text-[#8f3125]"
          : "border border-[#b6dfc8] bg-[#eef9f1] text-[#1f6a3d]"
      }`}
    >
      {error ?? success}
    </div>
  );
}
