import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Vehicle } from "@/models/Vehicle";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

// Configure Cloudinary only if environment variables are present
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const vehicleId = formData.get("vehicleId") as string | null;

    if (!file || !vehicleId) {
      return NextResponse.json(
        { success: false, error: "Missing file or vehicleId" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle || vehicle.isDeleted) {
      return NextResponse.json(
        { success: false, error: "Vehicle not found" },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let fileUrl = "";

    if (isCloudinaryConfigured) {
      // Cloudinary Upload
      const mime = file.type;
      const encoding = "base64";
      const base64Data = buffer.toString("base64");
      const fileUri = `data:${mime};${encoding},${base64Data}`;

      const uploadResult = await cloudinary.uploader.upload(fileUri, {
        folder: "transitops_documents",
        resource_type: "auto",
      });

      fileUrl = uploadResult.secure_url;
    } else {
      // Local Upload Fallback
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Generate clean and unique filename
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filename = `${uniqueSuffix}-${cleanFileName}`;
      const filePath = path.join(uploadDir, filename);

      // Write file locally
      await fs.promises.writeFile(filePath, buffer);
      fileUrl = `/uploads/${filename}`;
    }

    // Save document details to Vehicle collection
    const newDoc = {
      name: file.name,
      url: fileUrl,
      uploadedAt: new Date(),
    };

    await Vehicle.findByIdAndUpdate(vehicleId, {
      $push: { documents: newDoc },
    });

    return NextResponse.json({
      success: true,
      document: newDoc,
      message: isCloudinaryConfigured
        ? "Uploaded to Cloudinary successfully"
        : "Saved to local uploads successfully (Cloudinary not configured)",
    });
  } catch (error: any) {
    console.error("Document upload API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload file" },
      { status: 500 }
    );
  }
}
