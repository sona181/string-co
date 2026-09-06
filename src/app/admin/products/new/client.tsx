"use client";

import { useActionState, useState } from "react";

type Category = { id: string; name: string; parentId: string | null };
type Brand    = { id: string; name: string };

type Props = {
  readonly categories: Category[];
  readonly brands: Brand[];
  readonly createProduct: (_prev: { error?: string } | undefined, fd: FormData) => Promise<{ error?: string }>;
};

export default function NewProductClient({ categories, brands, createProduct }: Props) {
  const [state, action, pending] = useActionState(createProduct, undefined);
  const [imageUrl, setImageUrl]       = useState("");
  const [audioUrl, setAudioUrl]       = useState("");
  const [model3dUrl, setModel3dUrl]   = useState("");
  const [uploading, setUploading]         = useState(false);
  const [uploadingAudio, setUploadingAudio]   = useState(false);
  const [uploadingModel, setUploadingModel]   = useState(false);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) setImageUrl(data.url);
      else alert("Upload failed: " + (data.error ?? "unknown"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/admin/upload-audio", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) setAudioUrl(data.url);
      else alert("Audio upload failed: " + (data.error ?? "unknown"));
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
      const fd = new FormData();
      fd.append("file", file);
      const res  = await fetch("/api/admin/upload-3d", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) setModel3dUrl(data.url);
      else alert("3D upload failed: " + (data.error ?? "unknown"));
    } finally {
      setUploadingModel(false);
      e.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-asphalt text-concrete p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <a href="/admin/products" className="text-rust-gray hover:text-concrete text-sm">← Back</a>
          <h1 className="text-2xl font-black">Add product</h1>
        </div>

        {state?.error && (
          <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm">
            {state.error}
          </div>
        )}

        <form action={action} className="space-y-6">
          {/* Hidden fields carry uploaded URLs */}
          <input type="hidden" name="imageUrl" value={imageUrl} />
          <input type="hidden" name="audioUrl" value={audioUrl} />
          <input type="hidden" name="model3dUrl" value={model3dUrl} />

          {/* Image upload */}
          <section className="bg-white/5 rounded-xl p-6">
            <h2 className="font-bold mb-4">Product image</h2>
            {imageUrl ? (
              <div className="relative inline-block">
                <img src={imageUrl} alt="preview" className="w-40 h-40 object-cover rounded-lg border border-white/10" />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center"
                >✕</button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors">
                <span className="text-3xl mb-2">📷</span>
                <span className="text-xs text-rust-gray">{uploading ? "Uploading…" : "Click to upload"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            )}
            <p className="text-xs text-rust-gray mt-2">Supports JPG, PNG, WEBP. Uploaded to Cloudinary.</p>
          </section>

          {/* Sound sample upload */}
          <section className="bg-white/5 rounded-xl p-6">
            <h2 className="font-bold mb-1">Sound sample <span className="text-rust-gray font-normal text-xs">(optional)</span></h2>
            <p className="text-xs text-rust-gray mb-4">A short clip of how the instrument actually sounds.</p>

            {audioUrl ? (
              <div className="space-y-3">
                <audio controls src={audioUrl} className="w-full h-10">
                  <track kind="captions" />
                </audio>
                <button
                  type="button"
                  onClick={() => setAudioUrl("")}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  ✕ Remove sample
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors">
                <span className="text-2xl mb-1">🎵</span>
                <span className="text-xs text-rust-gray">{uploadingAudio ? "Uploading…" : "Click to upload MP3 / WAV / M4A · max 10 MB"}</span>
                <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} disabled={uploadingAudio} />
              </label>
            )}
          </section>

          {/* 3D model upload */}
          <section className="bg-white/5 rounded-xl p-6">
            <h2 className="font-bold mb-1">3D model <span className="text-rust-gray font-normal text-xs">(optional)</span></h2>
            <p className="text-xs text-rust-gray mb-4">Rotatable GLB file — customers can spin it in 3D. Max 50 MB.</p>

            {model3dUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-2xl">🎸</span>
                  <span className="text-xs text-rust-gray font-mono truncate flex-1">{model3dUrl.split("/").pop()}</span>
                  <button
                    type="button"
                    onClick={() => setModel3dUrl("")}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                  >
                    ✕ Remove
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/20 rounded-lg cursor-pointer hover:border-white/40 transition-colors">
                <span className="text-2xl mb-1">📦</span>
                <span className="text-xs text-rust-gray">{uploadingModel ? "Uploading…" : "Click to upload GLB · max 50 MB"}</span>
                <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleModelUpload} disabled={uploadingModel} />
              </label>
            )}
          </section>

          {/* Basic details */}
          <section className="bg-white/5 rounded-xl p-6 space-y-4">
            <h2 className="font-bold">Instrument details</h2>

            <div>
              <label htmlFor="name" className="block text-xs text-rust-gray mb-1">Name *</label>
              <input
                id="name" name="name" required
                placeholder="e.g. Fender Stratocaster Player Series"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="brandId" className="block text-xs text-rust-gray mb-1">Brand *</label>
                <select id="brandId" name="brandId" required className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400/50">
                  <option value="">— select —</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {brands.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">No brands yet — <a href="/admin/brands" className="underline">add one first</a></p>
                )}
              </div>
              <div>
                <label htmlFor="categoryId" className="block text-xs text-rust-gray mb-1">Category *</label>
                <select id="categoryId" name="categoryId" required className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400/50">
                  <option value="">— select —</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.parentId ? "↳ " : ""}{c.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">No categories — <a href="/admin/categories" className="underline">add one first</a></p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="basePrice" className="block text-xs text-rust-gray mb-1">Base price (USD) *</label>
                <input
                  id="basePrice" name="basePrice" type="number" min="0" step="0.01" required
                  placeholder="999.99"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-yellow-400/50"
                />
              </div>
              <div>
                <label htmlFor="sku" className="block text-xs text-rust-gray mb-1">SKU * <span className="font-normal">(unique ID)</span></label>
                <input
                  id="sku" name="sku" required
                  placeholder="FDR-STRAT-001"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-yellow-400/50"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs text-rust-gray mb-1">Description *</label>
              <textarea
                id="description" name="description" required rows={5}
                placeholder="Describe the instrument — body wood, neck profile, pickups, hardware, tone character…"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm resize-y focus:outline-none focus:border-yellow-400/50"
              />
            </div>

            <div>
              <label htmlFor="genre" className="block text-xs text-rust-gray mb-1">Genre theme <span className="font-normal">(optional)</span></label>
              <select id="genre" name="genre" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-yellow-400/50">
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
          </section>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={pending || uploading || uploadingModel}
              className="px-6 py-2.5 bg-yellow-400 text-black font-bold rounded-lg text-sm hover:brightness-110 transition-all disabled:opacity-50"
            >
              {pending ? "Saving…" : "Create product"}
            </button>
            <a
              href="/admin/products"
              className="px-6 py-2.5 border border-white/10 text-rust-gray rounded-lg text-sm hover:bg-white/5 transition-all"
            >
              Cancel
            </a>
          </div>
        </form>

        <p className="mt-8 text-xs text-rust-gray">
          After creating, open the product to add color variants and per-variant images.
        </p>
      </div>
    </div>
  );
}
