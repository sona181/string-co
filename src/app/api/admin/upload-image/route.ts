import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const session = await auth();
  console.log("[upload-image] role:", session?.user?.role, "cloud_name:", process.env.CLOUDINARY_CLOUD_NAME?.slice(0, 4));
  if (session?.user?.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized — role: " + String(session?.user?.role) }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return Response.json({ error: "No file provided" }, { status: 400 });

  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const result = await new Promise<{ secure_url: string; width: number; height: number }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "string-co/products" }, (err, res) => {
          if (err || !res) reject(err ?? new Error("Upload failed"));
          else resolve({ secure_url: res.secure_url, width: res.width, height: res.height });
        })
        .end(buffer);
    });
    return Response.json({ url: result.secure_url, width: result.width, height: result.height });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Cloudinary upload error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}
