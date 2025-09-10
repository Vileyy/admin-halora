import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Kiểm tra xem có đang ở trang login hoặc signup không
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isSignupPage = request.nextUrl.pathname === "/signup";

  // Kiểm tra xem có đang ở trang dashboard không
  const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

  // Kiểm tra trạng thái đăng nhập từ cookie
  const authCookie = request.cookies.get("auth-token");
  const userRole = request.cookies.get("user-role");
  const isAuthenticated = !!authCookie && authCookie.value !== "";

  // Nếu chưa đăng nhập và đang cố truy cập dashboard
  if (!isAuthenticated && isDashboardPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Nếu đã đăng nhập và đang ở trang login hoặc signup, chuyển về dashboard
  if (isAuthenticated && (isLoginPage || isSignupPage)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Cho phép truy cập trang chủ
  if (request.nextUrl.pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Thêm thông tin user role vào headers để có thể sử dụng trong components
  if (isAuthenticated && userRole) {
    const response = NextResponse.next();
    response.headers.set("x-user-role", userRole.value);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
