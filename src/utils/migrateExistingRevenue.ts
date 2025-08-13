import { database } from "@/lib/firebase";
import { ref, onValue, push, off } from "firebase/database";

export interface ExistingOrder {
  id: string;
  userId: string;
  status: string;
  items: Array<{
    id: string;
    name: string;
    image: string;
    price: string;
    quantity: number;
    category?: string;
  }>;
  completedAt?: string;
  updatedAt: string;
}

export interface UserData {
  displayName?: string;
  email?: string;
  phone?: string;
  address?: string;
  orders?: { [orderId: string]: ExistingOrder };
}

export async function migrateExistingDeliveredOrders() {
  return new Promise<{ success: number; errors: number }>((resolve, reject) => {
    const usersRef = ref(database, "users");
    let success = 0;
    let errors = 0;

    const unsubscribe = onValue(
      usersRef,
      async (snapshot) => {
        try {
          const data = snapshot.val();
          if (!data) {
            resolve({ success: 0, errors: 0 });
            return;
          }

          console.log("Starting migration of existing delivered orders...");

          // Duyệt qua tất cả users
          for (const [userId, userData] of Object.entries(data)) {
            if (
              userData &&
              typeof userData === "object" &&
              "orders" in userData
            ) {
              const user = userData as UserData;

              const userInfo = {
                displayName: user.displayName || "",
                email: user.email || "",
                phone: user.phone || "",
                address: user.address || "",
              };

              if (user.orders) {
                // Duyệt qua tất cả orders của user này
                for (const [orderId, orderData] of Object.entries(
                  user.orders
                )) {
                  if (orderData && orderData.status === "delivered") {
                    try {
                      const completedAt =
                        orderData.completedAt ||
                        orderData.updatedAt ||
                        new Date().toISOString();
                      const date = new Date(completedAt);
                      const month = `${date.getFullYear()}-${String(
                        date.getMonth() + 1
                      ).padStart(2, "0")}`;
                      const year = String(date.getFullYear());

                      // Lưu từng sản phẩm trong đơn hàng
                      for (const item of orderData.items) {
                        const revenueItem = {
                          orderId,
                          userId,
                          userInfo,
                          productId: item.id,
                          productName: item.name,
                          productImage: item.image,
                          productCategory: item.category || "uncategorized",
                          quantity: item.quantity,
                          unitPrice: parseInt(item.price),
                          totalPrice: parseInt(item.price) * item.quantity,
                          completedAt,
                          date: completedAt.split("T")[0], // YYYY-MM-DD format
                          month,
                          year,
                        };

                        // Lưu vào Firebase
                        const revenueRef = ref(database, "revenue");
                        await push(revenueRef, revenueItem);
                        success++;
                        console.log(
                          `Migrated product ${item.name} from order ${orderId}`
                        );
                      }
                    } catch (error) {
                      console.error(`Error migrating order ${orderId}:`, error);
                      errors++;
                    }
                  }
                }
              }
            }
          }

          console.log(
            `Migration completed: ${success} items migrated, ${errors} errors`
          );
          off(usersRef, "value", unsubscribe);
          resolve({ success, errors });
        } catch (error) {
          console.error("Migration error:", error);
          off(usersRef, "value", unsubscribe);
          reject(error);
        }
      },
      (error) => {
        console.error("Firebase error:", error);
        reject(error);
      }
    );
  });
}
