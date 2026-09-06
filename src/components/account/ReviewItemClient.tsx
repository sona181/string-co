"use client";

import { useState, useActionState, useTransition } from "react";
import Link from "next/link";
import { Star, Pencil, Trash2, X } from "lucide-react";
import { deleteReview, updateReview } from "@/lib/actions/reviews";

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  product: { id: string; name: string };
};

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star
            className="w-5 h-5 transition-opacity hover:opacity-80"
            style={n <= value
              ? { fill: "var(--theme-accent)", color: "var(--theme-accent)" }
              : { color: "rgba(255,255,255,0.15)" }}
          />
        </button>
      ))}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid var(--theme-border)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  color: "var(--theme-text)",
  outline: "none",
  resize: "none" as const,
};

export default function ReviewItemClient({ review }: Readonly<{ review: Review }>) {
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [pending, startTransition] = useTransition();

  const [error, formAction, submitting] = useActionState(
    async (prev: unknown, fd: FormData) => {
      fd.set("rating", String(rating));
      const result = await updateReview(prev, fd);
      if (!result) setEditing(false);
      return result;
    },
    undefined,
  );

  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--theme-card-bg)", border: "1px solid var(--theme-border)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <Link
            href={`/product/${review.product.id}`}
            className="font-semibold text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--theme-text)" }}
          >
            {review.product.name}
          </Link>
          <p className="text-xs mt-0.5" style={{ color: "var(--theme-panel-subtext)" }}>{date}</p>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => setEditing((e) => !e)}
            className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ color: "var(--theme-panel-subtext)" }}
          >
            {editing ? <X className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => startTransition(async () => { await deleteReview(review.id); })}
            disabled={pending}
            className="p-1.5 rounded-lg transition-colors hover:text-red-400 hover:bg-red-950/30"
            style={{ color: "var(--theme-panel-subtext)" }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {editing ? (
        <form action={formAction} className="space-y-3 mt-2">
          <input type="hidden" name="id" value={review.id} />
          {error && (
            <p className="text-sm rounded-lg px-3 py-2" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
              {error}
            </p>
          )}
          <div>
            <p className="text-xs font-medium mb-1.5" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>
              Rating
            </p>
            <StarPicker value={rating} onChange={setRating} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>
              Comment
            </label>
            <textarea name="comment" defaultValue={review.comment ?? ""} rows={3} style={inputStyle}
              className="focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-0" />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
              style={{ background: "var(--theme-accent)", color: "#fff", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}
            >
              {submitting ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm px-4 py-2 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: "var(--theme-panel-subtext)" }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex gap-0.5 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4"
                style={i < review.rating
                  ? { fill: "var(--theme-accent)", color: "var(--theme-accent)" }
                  : { color: "rgba(255,255,255,0.15)" }}
              />
            ))}
          </div>
          {review.comment && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--theme-panel-subtext)" }}>
              {review.comment}
            </p>
          )}
        </>
      )}
    </div>
  );
}
