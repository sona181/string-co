"use client";

import { useActionState } from "react";
import { createProductFromForm } from "@/app/actions/admin";

type Props = {
  readonly categories: { id: string; name: string; parentId: string | null }[];
  readonly brands: { id: string; name: string }[];
};

export default function CreateProductForm({ categories, brands }: Props) {
  const [state, action, pending] = useActionState(createProductFromForm, undefined);

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <h1>Add product</h1>

      {state?.error && (
        <p style={{ color: "red", marginBottom: "1rem" }}>{state.error}</p>
      )}

      <form action={action} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="name">Name *</label><br />
          <input id="name" name="name" required style={{ width: "100%" }} />
        </div>

        <div>
          <label htmlFor="description">Description *</label><br />
          <textarea id="description" name="description" rows={4} required style={{ width: "100%" }} />
        </div>

        <div>
          <label htmlFor="basePrice">Base price (USD) *</label><br />
          <input id="basePrice" name="basePrice" type="number" min="0" step="0.01" required style={{ width: "100%" }} />
        </div>

        <div>
          <label htmlFor="sku">SKU *</label><br />
          <input id="sku" name="sku" placeholder="e.g. FDR-STRAT-001" required style={{ width: "100%" }} />
        </div>

        <div>
          <label htmlFor="brandId">Brand *</label><br />
          <select id="brandId" name="brandId" required style={{ width: "100%" }}>
            <option value="">— select —</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="categoryId">Category *</label><br />
          <select id="categoryId" name="categoryId" required style={{ width: "100%" }}>
            <option value="">— select —</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.parentId ? "↳ " : ""}{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Create product"}
          </button>
          {" "}
          <a href="/admin/products">Cancel</a>
        </div>
      </form>
    </div>
  );
}
