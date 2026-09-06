import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_BYTES    = 10 * 1024 * 1024; // 10 MB
const AUDIO_TYPES  = new Set(["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/mp4", "audio/m4a", "audio/aac", "audio/ogg"]);

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  if (!AUDIO_TYPES.has(file.type)) {
    return Response.json({ error: "Unsupported format — use MP3, WAV, or M4A" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File too large — max 10 MB" }, { status: 413 });
  }

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: "string-co/audio", resource_type: "video" },
          (err, res) => {
            if (err || !res) reject(err ?? new Error("Upload failed"));
            else resolve(res as { secure_url: string });
          },
        )
        .end(buffer);
    });
    return Response.json({ url: result.secure_url });
  } catch (err) {
    console.error("Cloudinary audio upload error:", err);
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
