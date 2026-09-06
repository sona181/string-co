"use client";

import { useState, useActionState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check } from "lucide-react";
import { createAddress, updateAddress, deleteAddress, setDefaultAddress } from "@/lib/actions/addresses";

type Address = {
  id: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(0,0,0,0.3)",
  border: "1px solid var(--theme-border)",
  borderRadius: 8,
  padding: "8px 12px",
  fontSize: 14,
  color: "var(--theme-text)",
  outline: "none",
};

function AddressForm({ address, onClose }: { address?: Address; onClose: () => void }) {
  const action = address ? updateAddress : createAddress;
  const [error, formAction, pending] = useActionState(
    async (prev: unknown, fd: FormData) => {
      const result = await action(prev, fd);
      if (!result) onClose();
      return result;
    },
    undefined,
  );

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-2xl p-5 mt-4"
      style={{ background: "rgba(0,0,0,0.25)", border: "1px solid var(--theme-border)" }}
    >
      {address && <input type="hidden" name="id" value={address.id} />}
      {error && (
        <p className="text-sm rounded-lg px-3 py-2" style={{ color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          {error}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>
            Address line 1 *
          </label>
          <input name="line1" required defaultValue={address?.line1} style={inputStyle}
            className="focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-0" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>
            Address line 2
          </label>
          <input name="line2" defaultValue={address?.line2 ?? ""} style={inputStyle}
            className="focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-0" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>City *</label>
          <input name="city" required defaultValue={address?.city} style={inputStyle}
            className="focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-0" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>State *</label>
          <input name="state" required defaultValue={address?.state} style={inputStyle}
            className="focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-0" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>Postal code *</label>
          <input name="postalCode" required defaultValue={address?.postalCode} style={inputStyle}
            className="focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-0" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--theme-panel-subtext)", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}>Country</label>
          <input name="country" defaultValue={address?.country ?? "US"} style={inputStyle}
            className="focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-0" />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="text-sm font-semibold px-5 py-2 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{ background: "var(--theme-accent)", color: "#fff", fontFamily: "var(--theme-font-eyebrow, sans-serif)" }}
        >
          {pending ? "Saving…" : address ? "Update" : "Add address"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-sm px-5 py-2 rounded-lg transition-colors"
          style={{ color: "var(--theme-panel-subtext)" }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AddressesClient({ addresses }: { readonly addresses: Address[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const cardBase: React.CSSProperties = {
    background: "var(--theme-card-bg)",
    border: "1px solid var(--theme-border)",
    borderRadius: 16,
    padding: "20px",
  };

  return (
    <div>
      <div className="space-y-3">
        {addresses.length === 0 && (
          <p className="text-sm" style={{ color: "var(--theme-panel-subtext)" }}>No addresses saved yet.</p>
        )}
        {addresses.map((addr) => (
          <div key={addr.id} style={cardBase}>
            <div className="flex items-start justify-between gap-3">
              <div>
                {addr.isDefault && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2 py-0.5 mb-2"
                    style={{ background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }}
                  >
                    <Check className="w-3 h-3" /> Default
                  </span>
                )}
                <p className="text-sm" style={{ color: "var(--theme-text)" }}>{addr.line1}</p>
                {addr.line2 && <p className="text-sm" style={{ color: "var(--theme-panel-subtext)" }}>{addr.line2}</p>}
                <p className="text-sm" style={{ color: "var(--theme-panel-subtext)" }}>
                  {addr.city}, {addr.state} {addr.postalCode}
                </p>
                <p className="text-sm" style={{ color: "var(--theme-panel-subtext)", opacity: 0.6 }}>{addr.country}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!addr.isDefault && (
                  <button
                    onClick={() => startTransition(async () => { await setDefaultAddress(addr.id); })}
                    disabled={pending}
                    className="text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                    style={{ color: "var(--theme-panel-subtext)" }}
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => setEditing(editing === addr.id ? null : addr.id)}
                  className="p-1.5 rounded-lg transition-opacity hover:opacity-70"
                  style={{ color: "var(--theme-panel-subtext)" }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => startTransition(async () => { await deleteAddress(addr.id); })}
                  disabled={pending}
                  className="p-1.5 rounded-lg transition-colors hover:text-red-400 hover:bg-red-950/30"
                  style={{ color: "var(--theme-panel-subtext)" }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {editing === addr.id && (
              <AddressForm address={addr} onClose={() => setEditing(null)} />
            )}
          </div>
        ))}
      </div>

      {showAdd ? (
        <AddressForm onClose={() => setShowAdd(false)} />
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold w-full justify-center px-4 py-3 rounded-2xl transition-colors hover:border-[var(--theme-accent)] hover:text-[var(--theme-accent)]"
          style={{
            border: "1px dashed var(--theme-border)",
            color: "var(--theme-panel-subtext)",
            fontFamily: "var(--theme-font-eyebrow, sans-serif)",
          }}
        >
          <Plus className="w-4 h-4" /> Add new address
        </button>
      )}
    </div>
  );
}
