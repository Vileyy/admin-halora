import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { auth, database } from "@/lib/firebase";
import { UserData } from "@/types/User";

// Lấy danh sách admin emails từ env
const getAdminEmails = (): string[] => {
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  return adminEmails
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
};

// Xác định role dựa trên email
const determineUserRole = (email: string): "admin" | "user" => {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email) ? "admin" : "user";
};

// Lưu user vào Realtime Database
const saveUserToDatabase = async (user: User): Promise<UserData> => {
  const userData: UserData = {
    uid: user.uid,
    email: user.email || "",
    role: determineUserRole(user.email || ""),
    createdAt: Date.now(),
  };

  // Kiểm tra xem user đã tồn tại chưa
  const userRef = ref(database, `users/${user.uid}`);
  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    await set(userRef, userData);
  } else {
    // Cập nhật role nếu cần (trường hợp admin emails thay đổi)
    const existingData = snapshot.val();
    if (existingData.role !== userData.role) {
      await set(userRef, { ...existingData, role: userData.role });
    }
    return { ...existingData, role: userData.role };
  }

  return userData;
};

// Đăng nhập bằng email và password
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<UserData> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userData = await saveUserToDatabase(userCredential.user);

    // Lưu thông tin authentication vào cookie
    const token = await userCredential.user.getIdToken();
    document.cookie = `auth-token=${token}; path=/; max-age=3600`;
    document.cookie = `user-role=${userData.role}; path=/; max-age=3600`;

    return userData;
  } catch (error) {
    console.error("Error signing in with email:", error);
    const firebaseError = error as { code: string };
    throw new Error(getErrorMessage(firebaseError.code));
  }
};

// Đăng nhập bằng Google
export const signInWithGoogle = async (): Promise<UserData> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const userData = await saveUserToDatabase(userCredential.user);

    // Lưu thông tin authentication vào cookie
    const token = await userCredential.user.getIdToken();
    document.cookie = `auth-token=${token}; path=/; max-age=3600`;
    document.cookie = `user-role=${userData.role}; path=/; max-age=3600`;

    return userData;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    const firebaseError = error as { code: string };
    throw new Error(getErrorMessage(firebaseError.code));
  }
};

// Đăng ký bằng Google (không lưu cookie, chuyển về login)
export const signUpWithGoogle = async (): Promise<UserData> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const userData = await saveUserToDatabase(userCredential.user);

    // Đăng xuất ngay sau khi đăng ký để user phải đăng nhập lại
    await signOut(auth);

    return userData;
  } catch (error) {
    console.error("Error signing up with Google:", error);
    const firebaseError = error as { code: string };
    throw new Error(getErrorMessage(firebaseError.code));
  }
};

// Logout when role check fail
export const signOutOnRoleFail = async (): Promise<void> => {
  try {
    await signOut(auth);
    // DeleteDelete cookies
    document.cookie =
      "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } catch (error) {
    console.error("Error signing out on role fail:", error);
  }
};

// Đăng ký tài khoản mới
export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<UserData> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const userData = await saveUserToDatabase(userCredential.user);

    await signOut(auth);

    return userData;
  } catch (error) {
    console.error("Error signing up:", error);
    const firebaseError = error as { code: string };
    throw new Error(getErrorMessage(firebaseError.code));
  }
};

// Đăng xuất
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    // Xóa cookies
    document.cookie =
      "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie =
      "user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Lấy user data từ database
export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
      return snapshot.val() as UserData;
    }

    return null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
};

// Helper function để convert Firebase error codes thành messages
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/user-not-found":
      return "Không tìm thấy tài khoản với email này.";
    case "auth/wrong-password":
      return "Mật khẩu không đúng.";
    case "auth/email-already-in-use":
      return "Email này đã được sử dụng.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.";
    case "auth/invalid-email":
      return "Email không hợp lệ.";
    case "auth/user-disabled":
      return "Tài khoản này đã bị vô hiệu hóa.";
    case "auth/too-many-requests":
      return "Quá nhiều yêu cầu. Vui lòng thử lại sau.";
    case "auth/popup-closed-by-user":
      return "Cửa sổ đăng nhập đã được đóng.";
    case "auth/cancelled-popup-request":
      return "Yêu cầu đăng nhập đã bị hủy.";
    default:
      return "Đã xảy ra lỗi. Vui lòng thử lại.";
  }
};
