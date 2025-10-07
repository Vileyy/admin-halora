import { NextRequest, NextResponse } from "next/server";

// Get API Pixel from .env
const PIXELDRAIN_API_KEY =
  process.env.PIXELDRAIN_API_KEY;
const PIXELDRAIN_BASE_URL = "https://pixeldrain.com/api";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Create a new FormData for Pixeldrain
    const pixeldrainFormData = new FormData();
    pixeldrainFormData.append("file", file);
    if (fileName) {
      pixeldrainFormData.append("name", fileName);
    }

    // Upload to Pixeldrain
    const response = await fetch(`${PIXELDRAIN_BASE_URL}/file`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`:${PIXELDRAIN_API_KEY}`).toString(
          "base64"
        )}`,
      },
      body: pixeldrainFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Pixeldrain API error:", errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Pixeldrain upload failed: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");
    const action = searchParams.get("action");

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "No file ID provided" },
        { status: 400 }
      );
    }

    if (action === "info") {
      // Get file info
      const response = await fetch(
        `${PIXELDRAIN_BASE_URL}/file/${fileId}/info`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${Buffer.from(
              `:${PIXELDRAIN_API_KEY}`
            ).toString("base64")}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          {
            success: false,
            error: `Failed to get file info: ${response.statusText}`,
            details: errorText,
          },
          { status: response.status }
        );
      }

      const result = await response.json();
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Get file info error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Request failed",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("fileId");

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: "No file ID provided" },
        { status: 400 }
      );
    }

    const response = await fetch(`${PIXELDRAIN_BASE_URL}/file/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${Buffer.from(`:${PIXELDRAIN_API_KEY}`).toString(
          "base64"
        )}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `Failed to delete file: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      },
      { status: 500 }
    );
  }
}
