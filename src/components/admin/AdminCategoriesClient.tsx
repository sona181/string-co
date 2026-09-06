"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, X, Check, Plus } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/app/actions/admin";

type Category = { id: string; name: string; slug: string; parentId: string | null };

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function AdminCategoriesClient({ categories }: { categories: Category[] }) {
  const [pending, startTransition] = useTransition();
  const [editId, setEditId]   = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editParent, setEditParent] = useState("");
  const [error, setError] = useState("");

  // New-category form
  const [newName,   setNewName]   = useState("");
  const [newSlug,   setNewSlug]   = useState("");
  const [newParent, setNewParent] = useState("");

  function startEdit(c: Category) {
    setEditId(c.id);
    setEditName(c.name);
    setEditSlug(c.slug);
    setEditParent(c.parentId ?? "");
    setError("");
  }

  function cancelEdit() { setEditId(null); setError(""); }

  function handleSaveEdit() {
    const fd = new FormData();
    fd.set("id",       editId!);
    fd.set("name",     editName);
    fd.set("slug",     editSlug);
    if (editParent) fd.set("parentId", editParent);
    startTransition(async () => {
      const r = await updateCategory(fd);
      if (r?.error) { setError(r.error); return; }
      setEditId(null);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", newName);
    fd.set("slug", newSlug);
    if (newParent) fd.set("parentId", newParent);
    startTransition(async () => {
      const r = await createCategory(fd);
      if (r?.error) { setError(r.error); return; }
      setNewName(""); setNewSlug(""); setNewParent(""); setError("");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this category? Products assigned to it will become uncategorized.")) return;
    startTransition(async () => {
      const r = await deleteCategory(id);
      if (r?.error) setError(r.error);
    });
  }

  const parentOptions = categories.filter(c => !c.parentId); // top-level only as parents

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-spray-red bg-spray-red/10 border border-spray-red/20 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/2">
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">Slug</th>
              <th className="text-left px-4 py-3 text-xs text-rust-gray font-semibold uppercase tracking-wider">Parent</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-rust-gray text-sm">No categories yet.</td></tr>
            )}
            {categories.map(c => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                {editId === c.id ? (
                  <>
                    <td className="px-4 py-2">
                      <input
                        className={input}
                        value={editName}
                        onChange={e => { setEditName(e.target.value); setEditSlug(slugify(e.target.value)); }}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input className={input} value={editSlug} onChange={e => setEditSlug(e.target.value)} />
                    </td>
                    <td className="px-4 py-2">
                      <select className={input} value={editParent} onChange={e => setEditParent(e.target.value)}>
                        <option value="">— none (top-level) —</option>
                        {parentOptions.filter(p => p.id !== c.id).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
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
                    <td className="px-4 py-3 text-concrete">{c.name}</td>
                    <td className="px-4 py-3 text-rust-gray font-mono text-xs">{c.slug}</td>
                    <td className="px-4 py-3 text-rust-gray">
                      {c.parentId ? categories.find(p => p.id === c.parentId)?.name ?? "—" : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <IconBtn onClick={() => startEdit(c)} title="Edit" color="yellow"><Pencil size={14} /></IconBtn>
                        <IconBtn onClick={() => handleDelete(c.id)} disabled={pending} title="Delete" color="red"><Trash2 size={14} /></IconBtn>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add new */}
      <form onSubmit={handleCreate} className="rounded-xl border border-white/5 bg-white/2 p-5 space-y-4">
        <p className="text-sm font-semibold text-concrete flex items-center gap-2"><Plus size={15} /> Add category</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={label}>Name</label>
            <input
              className={input}
              placeholder="Electric Guitars"
              value={newName}
              onChange={e => { setNewName(e.target.value); setNewSlug(slugify(e.target.value)); }}
              required
            />
          </div>
          <div>
            <label className={label}>Slug</label>
            <input
              className={input}
              placeholder="electric-guitars"
              value={newSlug}
              onChange={e => setNewSlug(e.target.value)}
              required
            />
          </div>
          <div>
            <label className={label}>Parent (optional)</label>
            <select className={input} value={newParent} onChange={e => setNewParent(e.target.value)}>
              <option value="">— top-level —</option>
              {parentOptions.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" disabled={pending} className={btnPrimary}>Add category</button>
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

const input    = "w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-concrete placeholder:text-rust-gray/50 focus:outline-none focus:border-tag-yellow/50 focus:ring-1 focus:ring-tag-yellow/20";
const label    = "block text-xs text-rust-gray mb-1.5";
const btnPrimary = "px-4 py-2 rounded-lg bg-tag-yellow text-asphalt text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50";
