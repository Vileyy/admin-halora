import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  try {
    console.log("Starting upload process...");

    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      console.log("No file provided");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("File details:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Max size is 10MB" },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log("Uploading to Cloudinary...");

    const result = await new Promise((resolve, reject) => {
      const uploadTimeout = setTimeout(() => {
        reject(new Error("Upload timeout after 30 seconds"));
      }, 30000);

      cloudinary.uploader
        .upload_stream(
          {
            folder: "uploads",
            resource_type: "auto",
            timeout: 30000,
          },
          (error, result) => {
            clearTimeout(uploadTimeout);
            if (error) {
              console.error("Cloudinary error:", error);
              return reject(error);
            }
            console.log("Upload successful:", result?.public_id);
            resolve(result);
          }
        )
        .end(buffer);
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Increase timeout for file uploads
export const maxDuration = 30;
