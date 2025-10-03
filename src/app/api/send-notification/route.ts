import { NextRequest, NextResponse } from "next/server";
import {
  sendPushNotification,
  sendPushNotificationToMultipleDevices,
  sendNotificationToAllUsers,
  sendNotificationToUser,
} from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, important, sendTo, tokens, userId } = body;

    // Validate input
    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const notification = {
      title,
      body: content,
      data: {
        important: important ? "true" : "false",
        timestamp: new Date().toISOString(),
        type: "admin_notification",
      },
    };

    let result;

    // Gửi đến tất cả users
    if (sendTo === "all") {
      console.log("📤 Sending notification to all users...");
      result = await sendNotificationToAllUsers(notification);
    }
    // Gửi đến user cụ thể theo userId
    else if (sendTo === "user" && userId) {
      console.log(`📤 Sending notification to user: ${userId}`);
      result = await sendNotificationToUser(userId, notification);
    }
    // Gửi đến danh sách tokens cụ thể
    else if (sendTo === "specific" && tokens && Array.isArray(tokens)) {
      console.log(`📤 Sending notification to ${tokens.length} devices...`);
      if (tokens.length === 1) {
        result = await sendPushNotification(tokens[0], notification);
      } else {
        result = await sendPushNotificationToMultipleDevices(
          tokens,
          notification
        );
      }
    }
    // Gửi đến một token cụ thể
    else if (tokens && typeof tokens === "string") {
      console.log("📤 Sending notification to single device...");
      result = await sendPushNotification(tokens, notification);
    } else {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 }
      );
    }

    console.log("✅ Notification sent successfully:", result);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.error("❌ Error sending push notification:", error);
    return NextResponse.json(
      {
        error: "Failed to send notification",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// API để test connection
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Push notification API is ready",
    timestamp: new Date().toISOString(),
  });
}
