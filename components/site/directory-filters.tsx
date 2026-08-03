import { Input } from "@/components/ui/input";

export function DirectoryFilters({
  search,
  tag,
  sort,
  tagOptions,
}: {
  search?: string;
  tag?: string;
  sort?: string;
  tagOptions: { name: string; slug: string }[];
}) {
  return (
    <form className="grid gap-4 rounded-[2rem] border border-[var(--line)] bg-white p-5 md:grid-cols-[2fr_1fr_1fr_auto]">
      <Input defaultValue={search} name="search" placeholder="Search by name" />
      <select
        className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none"
        defaultValue={tag ?? ""}
        name="tag"
      >
        <option value="">All tags</option>
        {tagOptions.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.name}
          </option>
        ))}
      </select>
      <select
        className="rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none"
        defaultValue={sort ?? "newest"}
        name="sort"
      >
        <option value="newest">Newest</option>
        <option value="alphabetical">Alphabetical</option>
      </select>
      <button className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-foreground)]" type="submit">
        Apply
      </button>
    </form>
  );
}
