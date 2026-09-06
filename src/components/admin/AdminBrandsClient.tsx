"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X, Check, Plus } from "lucide-react";
import { createBrand, updateBrand, deleteBrand } from "@/app/actions/admin";

type Brand = { id: string; name: string; _count: { products: number } };

export default function AdminBrandsClient({ brands }: { brands: Brand[] }) {
  const [pending, startTransition] = useTransition();
  const [editId, setEditId]     = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName]   = useState("");
  const [error, setError]       = useState("");

  function startEdit(b: Brand) { setEditId(b.id); setEditName(b.name); setError(""); }
  function cancelEdit() { setEditId(null); setError(""); }

  function handleSaveEdit() {
    const fd = new FormData();
    fd.set("id", editId!);
    fd.set("name", editName);
    startTransition(async () => {
      const r = await updateBrand(fd);
      if (r?.error) { setError(r.error); return; }
      setEditId(null);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", newName);
    startTransition(async () => {
      const r = await createBrand(fd);
      if (r?.error) { setError(r.error); return; }
      setNewName(""); setError("");
    });
  }

  function handleDelete(id: string, count: number) {
    if (count > 0 && !confirm(`This brand has ${count} product(s). Delete anyway?`)) return;
    startTransition(async () => {
      const r = await deleteBrand(id);
      if (r?.error) setError(r.error);
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-spray-red bg-spray-red/10 border border-spray-red/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/2">
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">Brand</th>
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">Products</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-rust-gray">No brands yet.</td></tr>
            )}
            {brands.map(b => (
              <tr key={b.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                {editId === b.id ? (
                  <>
                    <td className="px-4 py-2" colSpan={2}>
                      <input
                        className="w-64 bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-concrete focus:outline-none focus:border-tag-yellow/50"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1.5">
                        <IconBtn onClick={handleSaveEdit} disabled={pending} title="Save" color="green"><Check size={14} /></IconBtn>
                        <IconBtn onClick={cancelEdit} title="Cancel" color="gray"><X size={14} /></IconBtn>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 text-concrete font-medium">{b.name}</td>
                    <td className="px-4 py-3 text-rust-gray">{b._count.products}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <IconBtn onClick={() => startEdit(b)} title="Edit" color="yellow"><Pencil size={14} /></IconBtn>
                        <IconBtn onClick={() => handleDelete(b.id, b._count.products)} disabled={pending} title="Delete" color="red"><Trash2 size={14} /></IconBtn>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleCreate} className="rounded-xl border border-white/5 bg-white/2 p-5">
        <p className="text-sm font-semibold text-concrete mb-4 flex items-center gap-2"><Plus size={15} /> Add brand</p>
        <div className="flex gap-3">
          <input
            className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm text-concrete placeholder:text-rust-gray/50 focus:outline-none focus:border-tag-yellow/50"
            placeholder="e.g. Fender, Gibson, Taylor…"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
          <button type="submit" disabled={pending}
            className="px-4 py-2 rounded-lg bg-tag-yellow text-asphalt text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50">
            Add brand
          </button>
        </div>
      </form>
    </div>
  );
}

function IconBtn({ onClick, disabled, title, color, children }: {
  onClick: () => void; disabled?: boolean; title: string;
  color: "yellow" | "red" | "green" | "gray"; children: React.ReactNode;
}) {
  const colors = {
    yellow: "text-tag-yellow hover:bg-tag-yellow/10",
    red:    "text-spray-red hover:bg-spray-red/10",
    green:  "text-chrome-teal hover:bg-chrome-teal/10",
    gray:   "text-rust-gray hover:bg-white/5",
  };
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className={`p-1.5 rounded transition-colors ${colors[color]} disabled:opacity-40`}>
      {children}
    </button>
  );
}
