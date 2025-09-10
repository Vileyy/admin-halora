import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json(
    { message: "Đăng xuất thành công" },
    { status: 200 }
  );

  // Xóa cookies
  response.cookies.delete("auth-token");
  response.cookies.delete("user-role");

  return response;
}
