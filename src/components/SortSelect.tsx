"use client";

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest"             },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc",   label: "Name: A–Z"          },
];

type Props = { current: string; hiddenParams: Record<string, string> };

export default function SortSelect({ current, hiddenParams }: Props) {
  return (
    <form method="GET" action="/shop">
      {Object.entries(hiddenParams).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <select
        name="sort"
        defaultValue={current}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="text-xs font-black uppercase tracking-wide bg-transparent border-b border-rust-gray/40 text-rust-gray py-3 px-1 focus:outline-none focus:border-tag-yellow transition-colors cursor-pointer"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </form>
  );
}
