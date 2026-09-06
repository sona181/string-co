import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED   = new Set(["model/gltf-binary", "application/octet-stream", "model/gltf+json"]);

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN")
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "glb" && ext !== "gltf")
    return Response.json({ error: "Only GLB or GLTF files are supported" }, { status: 415 });

  if (!ALLOWED.has(file.type) && ext !== "glb" && ext !== "gltf")
    return Response.json({ error: "Unsupported file type" }, { status: 415 });

  if (file.size > MAX_BYTES)
    return Response.json({ error: "File too large — max 50 MB" }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "string-co/models", resource_type: "raw", public_id: file.name.replace(/\.[^.]+$/, "") },
          (err, res) => {
            if (err || !res) reject(err ?? new Error("Upload failed"));
            else resolve(res as { secure_url: string });
          },
        )
        .end(buffer);
    });
    return Response.json({ url: result.secure_url });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("3D upload error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
