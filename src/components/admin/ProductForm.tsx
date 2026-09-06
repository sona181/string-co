"use client";

import { useState, useTransition, useId } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Upload, X, ChevronDown, ChevronRight } from "lucide-react";
import { saveProduct, createBrand, createCategory, createCustomizationOption } from "@/app/actions/admin";
import type { VariantDraft } from "@/app/actions/admin";

type Option = { id: string; optionType: string; name: string; hexOrValue: string | null };
type Category = { id: string; name: string; parentId: string | null };
type Brand = { id: string; name: string };

type ExistingVariant = VariantDraft & { id: string };
type ExistingProduct = {
  id: string; name: string; description: string; basePrice: number; sku: string;
  brandId: string; categoryId: string; imageUrl: string | null; model3dUrl: string | null;
  audioUrl: string | null; genre: string | null;
  attachedOptionIds: string[]; variants: ExistingVariant[];
};

type Props = { categories: Category[]; brands: Brand[]; allOptions: Option[]; product?: ExistingProduct };

type DraftVariant = {
  key: string; id?: string;
  bodyColorOptionId: string; pickguardOptionId: string; hardwareOptionId: string;
  imageUrl: string; priceDelta: string; sku: string;
};

type FieldErrors = Partial<Record<"name"|"description"|"basePrice"|"sku"|"brandId"|"categoryId", string>>;

function emptyVariant(key: string): DraftVariant {
  return { key, bodyColorOptionId: "", pickguardOptionId: "", hardwareOptionId: "", imageUrl: "", priceDelta: "0", sku: "" };
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function ProductForm({ categories: initCategories, brands: initBrands, allOptions: initOptions, product }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const uid = useId();

  const [categories, setCategories] = useState(initCategories);
  const [brands, setBrands]         = useState(initBrands);
  const [allOptions, setAllOptions]  = useState(initOptions);

  const [name, setName]             = useState(product?.name ?? "");
  const [description, setDesc]      = useState(product?.description ?? "");
  const [basePrice, setBasePrice]   = useState(product?.basePrice.toString() ?? "");
  const [sku, setSku]               = useState(product?.sku ?? "");
  const [brandId, setBrandId]       = useState(product?.brandId ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [imageUrl, setImageUrl]       = useState(product?.imageUrl ?? "");
  const [audioUrl, setAudioUrl]       = useState(product?.audioUrl ?? "");
  const [model3dUrl, setModel3dUrl]   = useState(product?.model3dUrl ?? "");
  const [genre, setGenre]             = useState(product?.genre ?? "");
  const [uploadingAudio, setUploadingAudio]   = useState(false);
  const [uploadingModel, setUploadingModel]   = useState(false);

  const [showNewBrand, setShowNewBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [brandAdding, setBrandAdding]   = useState(false);

  const [showNewCat, setShowNewCat]   = useState(false);
  const [newCatName, setNewCatName]   = useState("");
  const [newCatParent, setNewCatParent] = useState("");
  const [catAdding, setCatAdding]     = useState(false);

  const [attachedIds, setAttachedIds] = useState<string[]>(product?.attachedOptionIds ?? []);
  const [showNewOpt, setShowNewOpt]   = useState(false);
  const [newOptType, setNewOptType]   = useState<"BODY_COLOR"|"PICKGUARD"|"HARDWARE">("BODY_COLOR");
  const [newOptName, setNewOptName]   = useState("");
  const [newOptHex, setNewOptHex]     = useState("");
  const [optAdding, setOptAdding]     = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);

  const [variants, setVariants]           = useState<DraftVariant[]>(
    product?.variants.map(v => ({
      key: v.id, id: v.id,
      bodyColorOptionId: v.bodyColorOptionId, pickguardOptionId: v.pickguardOptionId,
      hardwareOptionId: v.hardwareOptionId, imageUrl: v.imageUrl,
      priceDelta: v.priceDelta.toString(), sku: v.sku,
    })) ?? []
  );
  const [removedVariantIds, setRemovedIds] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors]      = useState<FieldErrors>({});
  const [globalError, setGlobalError]      = useState("");

  const bodyColors = allOptions.filter(o => o.optionType === "BODY_COLOR" && attachedIds.includes(o.id));
  const pickguards = allOptions.filter(o => o.optionType === "PICKGUARD"  && attachedIds.includes(o.id));
  const hardware   = allOptions.filter(o => o.optionType === "HARDWARE"   && attachedIds.includes(o.id));

  async function handleAddBrand(e: React.FormEvent) {
    e.preventDefault();
    setBrandAdding(true);
    const fd = new FormData(); fd.set("name", newBrandName);
    const r = await createBrand(fd);
    setBrandAdding(false);
    if (r?.error) { setGlobalError(r.error); return; }
    if (r?.id) {
      setBrands(prev => [...prev, { id: r.id, name: newBrandName }].sort((a,b) => a.name.localeCompare(b.name)));
      setBrandId(r.id);
    }
    setNewBrandName(""); setShowNewBrand(false);
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setCatAdding(true);
    const fd = new FormData();
    fd.set("name", newCatName); fd.set("slug", slugify(newCatName));
    if (newCatParent) fd.set("parentId", newCatParent);
    const r = await createCategory(fd);
    setCatAdding(false);
    if (r?.error) { setGlobalError(r.error); return; }
    if (r?.id) {
      setCategories(prev => [...prev, { id: r.id, name: newCatName, parentId: newCatParent || null }]);
      setCategoryId(r.id);
    }
    setNewCatName(""); setNewCatParent(""); setShowNewCat(false);
  }

  async function handleAddOption(e: React.FormEvent) {
    e.preventDefault();
    setOptAdding(true);
    const fd = new FormData();
    fd.set("optionType", newOptType); fd.set("name", newOptName); fd.set("hexOrValue", newOptHex);
    const r = await createCustomizationOption(fd);
    setOptAdding(false);
    if (!r?.ok || !r.id) { setGlobalError("Failed to add option"); return; }
    const newOpt = { id: r.id, optionType: newOptType, name: newOptName, hexOrValue: newOptHex || null };
    setAllOptions(prev => [...prev, newOpt]);
    setAttachedIds(prev => [...prev, r.id]);
    setNewOptName(""); setNewOptHex(""); setShowNewOpt(false);
  }

  function toggleOption(id: string) {
    setAttachedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  function addVariant() { setVariants(prev => [...prev, emptyVariant(`new-${Date.now()}`)]); }

  function removeVariant(key: string, id?: string) {
    setVariants(prev => prev.filter(v => v.key !== key));
    if (id) setRemovedIds(prev => [...prev, id]);
  }

  function updateVariant(key: string, patch: Partial<DraftVariant>) {
    setVariants(prev => prev.map(v => v.key === key ? { ...v, ...patch } : v));
  }

  async function uploadImage(file: File, onUrl: (url: string) => void, setUploading: (b: boolean) => void) {
    setUploading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res  = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) onUrl(data.url);
      else setGlobalError("Image upload failed: " + (data.error ?? "unknown"));
    } finally { setUploading(false); }
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res  = await fetch("/api/admin/upload-audio", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) setAudioUrl(data.url);
      else setGlobalError("Audio upload failed: " + (data.error ?? "unknown"));
    } finally {
      setUploadingAudio(false);
      e.target.value = "";
    }
  }

  async function handleModelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingModel(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res  = await fetch("/api/admin/upload-3d", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) setModel3dUrl(data.url);
      else setGlobalError("3D upload failed: " + (data.error ?? "unknown"));
    } finally {
      setUploadingModel(false);
      e.target.value = "";
    }
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!name.trim())        e.name        = "Name is required";
    if (!description.trim()) e.description = "Description is required";
    if (!basePrice || isNaN(parseFloat(basePrice)) || parseFloat(basePrice) < 0) e.basePrice = "Enter a valid price";
    if (!sku.trim())         e.sku         = "SKU is required";
    if (!brandId)            e.brandId     = "Select a brand";
    if (!categoryId)         e.categoryId  = "Select a category";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError("");
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});

    startTransition(async () => {
      const result = await saveProduct({
        id: product?.id, name, description,
        basePrice: parseFloat(basePrice), sku, brandId, categoryId,
        imageUrl: imageUrl || null, model3dUrl: model3dUrl || null, audioUrl: audioUrl || null,
        genre: genre || null,
        attachedOptionIds: attachedIds,
        variants: variants.map(v => ({
          id: v.id,
          bodyColorOptionId: v.bodyColorOptionId, pickguardOptionId: v.pickguardOptionId,
          hardwareOptionId: v.hardwareOptionId, imageUrl: v.imageUrl,
          priceDelta: parseFloat(v.priceDelta) || 0, sku: v.sku,
        })),
        removedVariantIds,
      });
      if (!result.ok) {
        const msg = result.error ?? "Save failed";
        if (msg.toLowerCase().includes("sku")) setFieldErrors({ sku: "This SKU is already taken — choose a unique one" });
        else setGlobalError(msg);
        return;
      }
      router.push("/admin/products?saved=1");
    });
  }

  const optionsByType: Record<string, Option[]> = {
    BODY_COLOR: allOptions.filter(o => o.optionType === "BODY_COLOR"),
    PICKGUARD:  allOptions.filter(o => o.optionType === "PICKGUARD"),
    HARDWARE:   allOptions.filter(o => o.optionType === "HARDWARE"),
  };
  const typeLabel: Record<string, string> = { BODY_COLOR: "Body color", PICKGUARD: "Pickguard", HARDWARE: "Hardware" };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {globalError && (
        <p className="text-sm text-spray-red bg-spray-red/10 border border-spray-red/20 rounded-lg px-4 py-3">{globalError}</p>
      )}

      {/* Basic info */}
      <section className={SC}>
        <h2 className={TC}>Basic info</h2>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="col-span-2">
            <label className={L}>Product name</label>
            <input className={I(!!fieldErrors.name)} value={name}
              onChange={e => { setName(e.target.value); setFieldErrors(p => ({...p, name: ""})); }} />
            {fieldErrors.name && <p className={ET}>{fieldErrors.name}</p>}
          </div>

          {/* Brand */}
          <div>
            <label className={L}>Brand</label>
            {showNewBrand ? (
              <form onSubmit={handleAddBrand} className="flex gap-2">
                <input className={I(false)} placeholder="Brand name" value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)} autoFocus required />
                <button type="submit" disabled={brandAdding} className={AB}>{brandAdding ? "…" : "Add"}</button>
                <button type="button" onClick={() => setShowNewBrand(false)} className={CB}><X size={13}/></button>
              </form>
            ) : (
              <div className="flex gap-2">
                <select className={`${I(!!fieldErrors.brandId)} flex-1`} value={brandId}
                  onChange={e => { setBrandId(e.target.value); setFieldErrors(p => ({...p, brandId: ""})); }}>
                  <option value="">— select brand —</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewBrand(true)} className={NB} title="New brand"><Plus size={13}/></button>
              </div>
            )}
            {fieldErrors.brandId && <p className={ET}>{fieldErrors.brandId}</p>}
          </div>

          {/* Category */}
          <div>
            <label className={L}>Category</label>
            {showNewCat ? (
              <form onSubmit={handleAddCategory} className="space-y-2">
                <input className={I(false)} placeholder="Category name" value={newCatName}
                  onChange={e => setNewCatName(e.target.value)} autoFocus required />
                <select className={I(false)} value={newCatParent} onChange={e => setNewCatParent(e.target.value)}>
                  <option value="">No parent (top-level)</option>
                  {categories.filter(c => !c.parentId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <button type="submit" disabled={catAdding} className={AB}>{catAdding ? "…" : "Add category"}</button>
                  <button type="button" onClick={() => setShowNewCat(false)} className={CB}><X size={13}/> Cancel</button>
                </div>
              </form>
            ) : (
              <div className="flex gap-2">
                <select className={`${I(!!fieldErrors.categoryId)} flex-1`} value={categoryId}
                  onChange={e => { setCategoryId(e.target.value); setFieldErrors(p => ({...p, categoryId: ""})); }}>
                  <option value="">— select category —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.parentId ? "  ↳ " : ""}{c.name}</option>)}
                </select>
                <button type="button" onClick={() => setShowNewCat(true)} className={NB} title="New category"><Plus size={13}/></button>
              </div>
            )}
            {fieldErrors.categoryId && <p className={ET}>{fieldErrors.categoryId}</p>}
          </div>

          {/* Price */}
          <div>
            <label className={L}>Base price (USD)</label>
            <input className={I(!!fieldErrors.basePrice)} type="number" min="0" step="0.01"
              value={basePrice} onChange={e => { setBasePrice(e.target.value); setFieldErrors(p => ({...p, basePrice: ""})); }} />
            {fieldErrors.basePrice && <p className={ET}>{fieldErrors.basePrice}</p>}
          </div>

          {/* SKU */}
          <div>
            <label className={L}>SKU <span className="text-rust-gray/60 normal-case font-normal">(must be unique)</span></label>
            <input className={`${I(!!fieldErrors.sku)} font-mono`} placeholder="FDR-STRAT-001"
              value={sku} onChange={e => { setSku(e.target.value); setFieldErrors(p => ({...p, sku: ""})); }} />
            {fieldErrors.sku && <p className={ET}>{fieldErrors.sku}</p>}
          </div>

          {/* Description */}
          <div className="col-span-2">
            <label className={L}>Description</label>
            <textarea className={`${I(!!fieldErrors.description)} h-28 resize-y`}
              value={description} onChange={e => { setDesc(e.target.value); setFieldErrors(p => ({...p, description: ""})); }} />
            {fieldErrors.description && <p className={ET}>{fieldErrors.description}</p>}
          </div>

          {/* Genre */}
          <div className="col-span-2">
            <label className={L}>Genre theme <span className="text-rust-gray font-normal">(optional)</span></label>
            <select className={I(false)} value={genre} onChange={e => setGenre(e.target.value)}>
              <option value="">— none —</option>
              <option value="HIP_HOP">Hip-Hop</option>
              <option value="CLASSICAL">Classical</option>
              <option value="JAZZ">Jazz</option>
              <option value="ROCK_METAL">Rock / Metal</option>
              <option value="ELECTRONIC">Electronic / EDM</option>
              <option value="COUNTRY_FOLK">Country / Folk</option>
              <option value="REGGAE">Reggae</option>
              <option value="BLUES_SOUL">Blues / Soul</option>
            </select>
            <p className="text-xs text-rust-gray mt-1">Controls which genre-pill filter this product appears under on the shop page.</p>
          </div>
        </div>
      </section>

      {/* Fallback image */}
      <section className={SC}>
        <h2 className={TC}>Product image <span className="text-xs font-normal text-rust-gray ml-1">— used when no variants exist</span></h2>
        <div className="mt-4">
          <ImageUpload value={imageUrl} onChange={setImageUrl} uploadFn={uploadImage} />
        </div>
      </section>

      {/* Sound sample */}
      <section className={SC}>
        <h2 className={TC}>Sound sample <span className="text-xs font-normal text-rust-gray ml-1">— optional</span></h2>
        <p className="text-xs text-rust-gray mt-1 mb-4">A short clip of how the instrument actually sounds. MP3, WAV, or M4A · max 10 MB.</p>
        {audioUrl ? (
          <div className="space-y-2">
            <audio controls src={audioUrl} className="w-full max-w-xs">
              <track kind="captions" />
            </audio>
            <button type="button" onClick={() => setAudioUrl("")} className="text-xs text-red-400 hover:text-red-300 transition-colors">
              ✕ Remove sample
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors">
            <span className="text-xl mb-1">🎵</span>
            <span className="text-xs text-rust-gray">{uploadingAudio ? "Uploading…" : "Click to upload audio"}</span>
            <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} disabled={uploadingAudio} />
          </label>
        )}
      </section>

      {/* 3D model */}
      <section className={SC}>
        <h2 className={TC}>3D model <span className="text-xs font-normal text-rust-gray ml-1">— optional</span></h2>
        <p className="text-xs text-rust-gray mt-1 mb-4">Upload a GLB file so customers can rotate the instrument in 3D. Max 50 MB.</p>
        {model3dUrl ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg border border-white/10">
              <span className="text-xl">📦</span>
              <span className="text-xs text-rust-gray font-mono truncate flex-1">{model3dUrl.split("/").pop()}</span>
              <button type="button" onClick={() => setModel3dUrl("")} className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0">
                ✕ Remove model
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors">
            <span className="text-xl mb-1">📦</span>
            <span className="text-xs text-rust-gray">{uploadingModel ? "Uploading…" : "Click to upload GLB · max 50 MB"}</span>
            <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleModelUpload} disabled={uploadingModel} />
          </label>
        )}
      </section>

      {/* Customization options — collapsible */}
      <section className={SC}>
        <button type="button" onClick={() => setOptionsOpen(o => !o)} className="flex items-center gap-2 w-full text-left">
          {optionsOpen ? <ChevronDown size={15} className="text-rust-gray"/> : <ChevronRight size={15} className="text-rust-gray"/>}
          <h2 className={TC}>
            Customization options
            {attachedIds.length > 0 && <span className="ml-2 text-xs font-normal text-chrome-teal">({attachedIds.length} attached)</span>}
          </h2>
          <span className="ml-auto text-xs text-rust-gray">{optionsOpen ? "collapse" : "expand — optional for simple products"}</span>
        </button>

        {optionsOpen && (
          <div className="mt-4 space-y-4">
            {Object.entries(optionsByType).map(([type, opts]) => opts.length === 0 ? null : (
              <div key={type}>
                <p className="text-xs font-semibold text-rust-gray uppercase tracking-wider mb-2">{typeLabel[type]}</p>
                <div className="flex flex-wrap gap-2">
                  {opts.map(o => {
                    const on = attachedIds.includes(o.id);
                    return (
                      <button key={o.id} type="button" onClick={() => toggleOption(o.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                          on ? "border-tag-yellow/60 bg-tag-yellow/10 text-concrete"
                             : "border-white/10 bg-white/2 text-rust-gray hover:border-white/20"}`}>
                        {o.hexOrValue && <span className="w-3 h-3 rounded-full border border-white/20 flex-shrink-0" style={{ background: o.hexOrValue }}/>}
                        {o.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {allOptions.length === 0 && !showNewOpt && (
              <p className="text-sm text-rust-gray">No options exist yet — add one below.</p>
            )}

            {showNewOpt ? (
              <form onSubmit={handleAddOption} className="rounded-lg border border-white/10 bg-white/3 p-4 space-y-3">
                <p className="text-xs font-semibold text-concrete">New customization option</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={L}>Type</label>
                    <select className={I(false)} value={newOptType} onChange={e => setNewOptType(e.target.value as typeof newOptType)}>
                      <option value="BODY_COLOR">Body color</option>
                      <option value="PICKGUARD">Pickguard</option>
                      <option value="HARDWARE">Hardware</option>
                    </select>
                  </div>
                  <div>
                    <label className={L}>Name</label>
                    <input className={I(false)} placeholder="e.g. Candy Apple Red" value={newOptName}
                      onChange={e => setNewOptName(e.target.value)} required autoFocus />
                  </div>
                  <div>
                    <label className={L}>Hex color <span className="font-normal text-rust-gray/60">(optional)</span></label>
                    <div className="flex gap-2 items-center">
                      <input className={`${I(false)} font-mono`} placeholder="#FF0000" value={newOptHex}
                        onChange={e => setNewOptHex(e.target.value)} />
                      {newOptHex && <span className="w-6 h-6 rounded-full border border-white/20 flex-shrink-0" style={{ background: newOptHex }}/>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={optAdding} className={AB}>{optAdding ? "Adding…" : "Add option"}</button>
                  <button type="button" onClick={() => setShowNewOpt(false)} className={CB}><X size={13}/> Cancel</button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={() => setShowNewOpt(true)}
                className="flex items-center gap-1.5 text-xs text-rust-gray hover:text-concrete transition-colors">
                <Plus size={13}/> Add new option
              </button>
            )}
          </div>
        )}
      </section>

      {/* Variants — only shown when options are attached */}
      {attachedIds.length > 0 && (
        <section className={SC}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className={TC}>Variants</h2>
              <p className="text-xs text-rust-gray mt-0.5">Only add variants you have photos for — not every combination is required.</p>
            </div>
            <button type="button" onClick={addVariant}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 text-sm text-concrete hover:bg-white/5 transition-colors flex-shrink-0 ml-4">
              <Plus size={14}/> Add variant
            </button>
          </div>
          {variants.length === 0 && (
            <p className="text-sm text-rust-gray bg-white/2 rounded-lg px-4 py-3 border border-white/5">No variants yet.</p>
          )}
          <div className="space-y-4">
            {variants.map(v => (
              <VariantRow key={v.key} variant={v}
                bodyColors={bodyColors} pickguards={pickguards} hardware={hardware}
                onChange={patch => updateVariant(v.key, patch)}
                onRemove={() => removeVariant(v.key, v.id)}
                uploadFn={uploadImage} />
            ))}
          </div>
        </section>
      )}

      {/* Submit */}
      <div className="flex gap-3 pb-12">
        <button type="submit" disabled={pending}
          className="px-6 py-2.5 rounded-lg bg-tag-yellow text-asphalt text-sm font-bold hover:brightness-110 transition-all disabled:opacity-50 min-w-32">
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <button type="button" onClick={() => router.push("/admin/products")} disabled={pending}
          className="px-6 py-2.5 rounded-lg border border-white/10 text-sm text-rust-gray hover:bg-white/5 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── ImageUpload ────────────────────────────────────────────────────────────

function ImageUpload({ value, onChange, uploadFn, small }: {
  value: string; onChange: (url: string) => void;
  uploadFn: (file: File, onUrl: (url: string) => void, setUploading: (b: boolean) => void) => Promise<void>;
  small?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void uploadFn(file, onChange, setUploading);
    e.target.value = "";
  }
  return (
    <div className="flex items-center gap-3">
      {value ? (
        <div className="relative group">
          <img src={value} alt="" className={`${small ? "w-12 h-12" : "w-20 h-20"} rounded-lg object-cover bg-white/5 border border-white/10`} />
          <button type="button" onClick={() => onChange("")}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-spray-red text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <X size={10}/>
          </button>
        </div>
      ) : (
        <div className={`${small ? "w-12 h-12" : "w-20 h-20"} rounded-lg bg-white/5 border border-dashed border-white/15 flex items-center justify-center text-rust-gray/40`}>
          <Upload size={small ? 14 : 20}/>
        </div>
      )}
      <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-sm text-rust-gray hover:bg-white/5 hover:text-concrete transition-colors">
        <Upload size={13}/>
        {uploading ? "Uploading…" : value ? "Replace" : "Upload image"}
        <input type="file" accept="image/*" className="hidden" onChange={handleChange} disabled={uploading}/>
      </label>
      {value && <p className="text-xs text-rust-gray/50 font-mono truncate max-w-40">{value.split("/").pop()}</p>}
    </div>
  );
}

// ── VariantRow ────────────────────────────────────────────────────────────

function VariantRow({ variant, bodyColors, pickguards, hardware, onChange, onRemove, uploadFn }: {
  variant: DraftVariant; bodyColors: Option[]; pickguards: Option[]; hardware: Option[];
  onChange: (patch: Partial<DraftVariant>) => void; onRemove: () => void;
  uploadFn: (file: File, onUrl: (url: string) => void, setUploading: (b: boolean) => void) => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/2 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="grid grid-cols-3 gap-3 flex-1">
          <div><label className={SL}>Body color</label><OptionSelect options={bodyColors} value={variant.bodyColorOptionId} onChange={v => onChange({ bodyColorOptionId: v })}/></div>
          <div><label className={SL}>Pickguard</label><OptionSelect options={pickguards} value={variant.pickguardOptionId} onChange={v => onChange({ pickguardOptionId: v })}/></div>
          <div><label className={SL}>Hardware</label><OptionSelect options={hardware} value={variant.hardwareOptionId} onChange={v => onChange({ hardwareOptionId: v })}/></div>
        </div>
        <button type="button" onClick={onRemove} className="p-1.5 rounded text-spray-red hover:bg-spray-red/10 transition-colors mt-5 flex-shrink-0"><Trash2 size={14}/></button>
      </div>
      <div className="flex items-end gap-4">
        <div><label className={SL}>Variant image</label><ImageUpload value={variant.imageUrl} onChange={url => onChange({ imageUrl: url })} uploadFn={uploadFn} small/></div>
        <div className="w-32">
          <label className={SL}>Price delta (±$)</label>
          <input className={`${SI} font-mono`} type="number" step="0.01" placeholder="0" value={variant.priceDelta} onChange={e => onChange({ priceDelta: e.target.value })}/>
        </div>
        <div className="flex-1">
          <label className={SL}>Variant SKU</label>
          <input className={`${SI} font-mono`} placeholder="FDR-STRAT-RED-BLK-001" value={variant.sku} onChange={e => onChange({ sku: e.target.value })}/>
        </div>
      </div>
    </div>
  );
}

function OptionSelect({ options, value, onChange }: { options: Option[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <select className={`${SI} appearance-none pr-7`} value={value} onChange={e => onChange(e.target.value)}>
        <option value="">— any —</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-rust-gray pointer-events-none"/>
    </div>
  );
}

// ── Style constants ────────────────────────────────────────────────────────

const SC = "rounded-xl border border-white/5 bg-white/2 p-6";
const TC = "text-base font-bold text-concrete";
const L  = "block text-xs text-rust-gray mb-1.5";
const SL = "block text-xs text-rust-gray mb-1";
const ET = "mt-1 text-xs text-spray-red";
const I  = (err: boolean) =>
  `w-full bg-[#0f0f0f] border ${err ? "border-spray-red/60" : "border-white/10"} rounded-lg px-3 py-2 text-sm text-concrete placeholder:text-rust-gray/40 focus:outline-none focus:border-tag-yellow/50 focus:ring-1 focus:ring-tag-yellow/20`;
const SI = "w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-concrete placeholder:text-rust-gray/40 focus:outline-none focus:border-tag-yellow/40";
const AB = "px-3 py-1.5 rounded-lg bg-tag-yellow text-asphalt text-xs font-bold hover:brightness-110 transition-all disabled:opacity-50 whitespace-nowrap";
const CB = "px-2 py-1.5 rounded-lg border border-white/10 text-xs text-rust-gray hover:bg-white/5 transition-all flex items-center gap-1";
const NB = "flex items-center justify-center w-9 h-9 rounded-lg border border-white/10 text-rust-gray hover:bg-white/5 hover:text-concrete transition-colors flex-shrink-0";
