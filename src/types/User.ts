export interface UserData {
  uid: string;
  email: string;
  role: "admin" | "user";
  createdAt: number;
}

export type UserRole = "admin" | "user";
