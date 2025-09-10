"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserData } from "@/services/authService";
import { UserData } from "@/types/User";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);

        // Lấy thông tin user từ database
        const dbUserData = await getUserData(firebaseUser.uid);
        setUserData(dbUserData);

        // Cập nhật cookies nếu cần
        if (dbUserData) {
          document.cookie = `user-role=${dbUserData.role}; path=/; max-age=3600`;
        }
      } else {
        setUser(null);
        setUserData(null);

        // Xóa cookies khi logout
        document.cookie =
          "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        document.cookie =
          "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    user,
    userData,
    loading,
    isAuthenticated: !!user,
    isAdmin: userData?.role === "admin",
  };
}
