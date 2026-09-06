"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import type { CardPalette } from "@/lib/themes";
import { checkReviewEligibility, createOrUpdateReview } from "@/app/actions/reviews";

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerLabel: string;
};

type Eligibility =
  | { loggedIn: false }
  | { loggedIn: true; hasQualifyingOrder: boolean; existingReview: { id: string; rating: number; comment: string | null } | null };

type Props = {
  productId: string;
  userId: string | null;
  initialReviews: ReviewItem[];
  palette: CardPalette;
};

function Stars({ n, color, size = 14 }: { n: number; color: string; size?: number }) {
  return (
    <span style={{ fontSize: size, letterSpacing: 1, color }}>
      {Array.from({ length: 5 }, (_, i) => (i < n ? "★" : "☆")).join("")}
    </span>
  );
}

function StarPicker({ value, onChange, palette }: { value: number; onChange: (n: number) => void; palette: CardPalette }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          style={{
            background: "none", border: "none", padding: "0 1px",
            cursor: "pointer", fontSize: 24, lineHeight: 1,
            color: n <= (hover || value) ? palette.eyebrow : palette.subtext,
            transition: "color 0.1s ease",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewPanel({ productId, userId, initialReviews, palette }: Props) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [eligibility, setEligibility] = useState<Eligibility | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!userId) {
      setEligibility({ loggedIn: false });
      return;
    }
    checkReviewEligibility(productId).then((result) => {
      const el = result as Eligibility;
      setEligibility(el);
      if (el.loggedIn && el.existingReview) {
        setRating(el.existingReview.rating);
        setComment(el.existingReview.comment ?? "");
      }
    });
  }, [productId, userId]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  const isEditing =
    eligibility?.loggedIn && eligibility.hasQualifyingOrder && !!eligibility.existingReview;

  const handleSubmit = useCallback(() => {
    if (rating === 0) { setFormError("Select a star rating first."); return; }
    setFormError(null);
    startTransition(async () => {
      const result = await createOrUpdateReview(productId, rating, comment);
      if (result.ok) {
        setReviews((prev) => {
          const existingId =
            eligibility?.loggedIn && eligibility.hasQualifyingOrder && eligibility.existingReview
              ? eligibility.existingReview.id
              : null;
          return [result.review, ...prev.filter((r) => r.id !== existingId)];
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        // Mark as editing going forward
        setEligibility((prev) =>
          prev?.loggedIn
            ? { ...prev, existingReview: { id: result.review.id, rating, comment: comment.trim() || null } }
            : prev,
        );
      } else {
        setFormError("Something went wrong — please try again.");
      }
    });
  }, [rating, comment, productId, eligibility]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

      {/* ── Summary bar ── */}
      {avgRating !== null ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 24, fontWeight: 900, color: palette.eyebrow, lineHeight: 1 }}>
            {avgRating.toFixed(1)}
          </span>
          <span style={{ fontSize: 18, color: palette.eyebrow }}>★</span>
          <span style={{ fontSize: 11, color: palette.subtext }}>
            · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </span>
        </div>
      ) : (
        <p style={{ margin: "0 0 12px", fontSize: 12, color: palette.subtext, fontStyle: "italic" }}>
          No reviews yet — be the first
        </p>
      )}

      <div style={{ width: 40, height: 1.5, background: palette.divider, borderRadius: 1, marginBottom: 16 }} />

      {/* ── Review list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
        {reviews.map((rev) => (
          <div
            key={rev.id}
            style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 14, borderBottom: `1px solid ${palette.divider}44` }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Stars n={rev.rating} color={palette.eyebrow} size={13} />
              <span style={{ fontSize: 10, color: palette.subtext }}>
                {new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: palette.text }}>{rev.reviewerLabel}</p>
            {rev.comment && (
              <p style={{ margin: 0, fontSize: 11, color: palette.subtext, lineHeight: 1.65 }}>{rev.comment}</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Divider before form ── */}
      <div style={{ width: 40, height: 1.5, background: palette.divider, borderRadius: 1, marginBottom: 16 }} />

      {/* ── Form section ── */}
      {eligibility === null ? (
        <p style={{ margin: 0, fontSize: 11, color: palette.subtext }}>Loading…</p>
      ) : !eligibility.loggedIn ? (
        <p style={{ margin: 0, fontSize: 11, color: palette.subtext }}>
          <a href="/login" style={{ color: palette.eyebrow, textDecoration: "underline", textUnderlineOffset: 2 }}>
            Sign in
          </a>{" "}
          to leave a review.
        </p>
      ) : !eligibility.hasQualifyingOrder ? (
        <p style={{ margin: 0, fontSize: 11, color: palette.subtext, fontStyle: "italic" }}>
          Purchase this product to leave a review.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p
            style={{
              margin: 0, fontSize: 10, fontWeight: 900,
              textTransform: "uppercase", letterSpacing: "0.12em", color: palette.eyebrow,
            }}
          >
            {isEditing ? "Your review" : "Leave a review"}
          </p>

          <StarPicker value={rating} onChange={setRating} palette={palette} />

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)"
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box", resize: "none",
              background: "transparent",
              border: `1.5px solid ${palette.border}`,
              borderRadius: 8, padding: "8px 10px",
              fontSize: 12, color: palette.text, fontFamily: "inherit",
              outline: "none",
            }}
          />

          {formError && (
            <p style={{ margin: 0, fontSize: 11, color: "#e44", fontStyle: "italic" }}>{formError}</p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleSubmit}
              disabled={isPending || rating === 0}
              style={{
                flex: 1, height: 36, border: "none", borderRadius: 8,
                background: palette.eyebrow, color: "#fff",
                fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                cursor: isPending || rating === 0 ? "not-allowed" : "pointer",
                opacity: isPending || rating === 0 ? 0.5 : 1,
                transition: "opacity 0.15s ease",
              }}
            >
              {isPending ? "Saving…" : isEditing ? "Update review" : "Submit review"}
            </button>

            {saved && (
              <span style={{ fontSize: 12, color: palette.eyebrow, fontWeight: 700, whiteSpace: "nowrap" }}>
                ✓ Saved
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
