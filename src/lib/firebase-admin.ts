import * as admin from "firebase-admin";

// Khởi tạo Firebase Admin SDK
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Firebase admin initialization error:", error);
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.database();
export const adminMessaging = admin.messaging();

/**
 * Gửi push notification đến một device token
 */
export async function sendPushNotification(
  token: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
) {
  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      token: token,
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          channelId: "default",
          priority: "high" as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    const response = await adminMessaging.send(message);
    console.log("✅ Successfully sent notification:", response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error("❌ Error sending notification:", error);
    throw error;
  }
}

/**
 * Gửi push notification đến nhiều device tokens
 */
export async function sendPushNotificationToMultipleDevices(
  tokens: string[],
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
) {
  try {
    if (tokens.length === 0) {
      return {
        success: false,
        message: "No tokens provided",
        successCount: 0,
        failureCount: 0,
      };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: tokens, // Tối đa 500 tokens mỗi lần
      android: {
        priority: "high" as const,
        notification: {
          sound: "default",
          channelId: "default",
          priority: "high" as const,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            contentAvailable: true,
          },
        },
      },
    };

    const response = await adminMessaging.sendEachForMulticast(message);
    console.log(
      `✅ Successfully sent ${response.successCount} notifications, failed ${response.failureCount}`
    );

    // Xử lý các token không hợp lệ
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error("❌ Failed token:", tokens[idx], resp.error);
        }
      });
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
        failedTokens,
      };
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("❌ Error sending notifications:", error);
    throw error;
  }
}

/**
 * Gửi notification đến tất cả users (lấy tokens từ Firebase Realtime Database)
 */
export async function sendNotificationToAllUsers(notification: {
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  try {
    // Lấy tất cả device tokens từ database
    const tokensSnapshot = await adminDb.ref("deviceTokens").once("value");
    const tokensData = tokensSnapshot.val();

    if (!tokensData) {
      return {
        success: false,
        message: "No device tokens found",
        totalTokens: 0,
        totalSuccess: 0,
        totalFailure: 0,
      };
    }

    // Chuyển đổi object thành array tokens
    const tokens: string[] = [];
    Object.values(tokensData).forEach((userTokens) => {
      if (typeof userTokens === "object" && userTokens !== null) {
        Object.values(userTokens).forEach((tokenData) => {
          if (
            typeof tokenData === "object" &&
            tokenData !== null &&
            "token" in tokenData
          ) {
            tokens.push(tokenData.token as string);
          }
        });
      }
    });

    if (tokens.length === 0) {
      return {
        success: false,
        message: "No valid tokens found",
        totalTokens: 0,
        totalSuccess: 0,
        totalFailure: 0,
      };
    }

    console.log(`📱 Found ${tokens.length} device tokens`);

    // Firebase cho phép gửi tối đa 500 tokens mỗi lần
    const batchSize = 500;
    const results = [];

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batch = tokens.slice(i, i + batchSize);
      const result = await sendPushNotificationToMultipleDevices(
        batch,
        notification
      );
      results.push(result);
    }

    const totalSuccess = results.reduce(
      (sum, r) => sum + (r.successCount || 0),
      0
    );
    const totalFailure = results.reduce(
      (sum, r) => sum + (r.failureCount || 0),
      0
    );

    return {
      success: true,
      totalSuccess,
      totalFailure,
      totalTokens: tokens.length,
    };
  } catch (error) {
    console.error("❌ Error sending notifications to all users:", error);
    throw error;
  }
}

/**
 * Gửi notification đến user cụ thể (lấy tokens từ userId)
 */
export async function sendNotificationToUser(
  userId: string,
  notification: {
    title: string;
    body: string;
    data?: Record<string, string>;
  }
) {
  try {
    // Lấy tokens của user từ database
    const tokensSnapshot = await adminDb
      .ref(`deviceTokens/${userId}`)
      .once("value");
    const tokensData = tokensSnapshot.val();

    if (!tokensData) {
      return {
        success: false,
        message: "No device tokens found for this user",
      };
    }

    // Lấy tất cả tokens của user
    const tokens: string[] = [];
    Object.values(tokensData).forEach((tokenData) => {
      if (
        typeof tokenData === "object" &&
        tokenData !== null &&
        "token" in tokenData
      ) {
        tokens.push(tokenData.token as string);
      }
    });

    if (tokens.length === 0) {
      return {
        success: false,
        message: "No valid tokens found for this user",
      };
    }

    // Gửi notification
    if (tokens.length === 1) {
      return await sendPushNotification(tokens[0], notification);
    } else {
      return await sendPushNotificationToMultipleDevices(tokens, notification);
    }
  } catch (error) {
    console.error("❌ Error sending notification to user:", error);
    throw error;
  }
}

export default admin;
