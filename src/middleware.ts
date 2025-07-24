import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Kiểm tra xem có đang ở trang login không
  const isLoginPage = request.nextUrl.pathname === "/login";

  // Kiểm tra xem có đang ở trang dashboard không
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  // Kiểm tra trạng thái đăng nhập từ cookie
  // Trong thực tế, bạn sẽ lưu token vào cookie thay vì localStorage
  const authCookie = request.cookies.get("auth-token");
  const isAuthenticated = !!authCookie;

  // Nếu chưa đăng nhập và đang cố truy cập dashboard
  if (!isAuthenticated && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Nếu đã đăng nhập và đang ở trang login, chuyển về dashboard
  if (isAuthenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
