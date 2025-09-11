import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";
import Link from "next/link";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left Column - Form */}
        <div className="flex flex-col justify-center px-4 py-8 lg:px-6">
          <div className="mx-auto w-full max-w-sm">
            {/* Logo */}
            <div className="mb-6 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-bold text-xl"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 text-white shadow-md animate-glow">
                  <span className="text-sm font-bold">H</span>
                </div>
                <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-400 bg-clip-text text-transparent">
                  Halora Cosmestic
                </span>
              </Link>
            </div>

            {/* Form Container */}
            <div className="animate-fade-in-up">{children}</div>
          </div>
        </div>

        {/* Right Column - Illustration */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-rose-400 via-pink-500 to-orange-500 animate-gradient lg:block">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

          {/* Content */}
          <div className="relative flex h-full flex-col justify-center p-8 text-white animate-slide-in-right">
            <div className="max-w-sm">
              <h2 className="mb-4 text-3xl font-bold leading-tight">
                Chào mừng trở lại
                <br />
                <span className="text-orange-200 animate-pulse">
                  Halora Cosmestic
                </span>
              </h2>

              <p className="mb-6 text-base text-rose-100">
                Đăng nhập vào hệ thống quản trị để tiếp tục quản lý doanh nghiệp
                của bạn một cách hiệu quả.
              </p>

              {/* Feature List */}
              <div className="space-y-3">
                <div
                  className="flex items-center gap-2 opacity-0 animate-fade-in-up"
                  style={{
                    animationDelay: "0.2s",
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <span className="text-rose-100 text-sm">
                    Bảo mật tuyệt đối
                  </span>
                </div>

                <div
                  className="flex items-center gap-2 opacity-0 animate-fade-in-up"
                  style={{
                    animationDelay: "0.4s",
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                  <span className="text-rose-100 text-sm">
                    Truy cập nhanh chóng
                  </span>
                </div>

                <div
                  className="flex items-center gap-2 opacity-0 animate-fade-in-up"
                  style={{
                    animationDelay: "0.6s",
                    animationFillMode: "forwards",
                  }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                  </div>
                  <span className="text-rose-100 text-sm">
                    Quản lý toàn diện
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm animate-float" />
            <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-orange-300/20 backdrop-blur-sm animate-float-delayed animate-sparkle" />

            {/* Additional decorative elements */}
            <div
              className="absolute top-1/4 right-1/4 h-12 w-12 rounded-full bg-rose-300/30 backdrop-blur-sm animate-float-slow"
              style={{ animationDelay: "1s" }}
            />
            <div className="absolute bottom-1/3 left-1/3 h-8 w-8 rounded-full bg-pink-300/40 backdrop-blur-sm animate-float-delayed animate-sparkle" />
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
