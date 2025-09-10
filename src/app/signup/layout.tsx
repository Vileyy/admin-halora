import Link from "next/link";

export default function SignupLayout({
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md">
                  <span className="text-sm font-bold">H</span>
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Halora Cosmestic
                </span>
              </Link>
            </div>

            {/* Form Container */}
            <div className="animate-fade-in-up">{children}</div>
          </div>
        </div>

        {/* Right Column - Illustration */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 animate-gradient lg:block">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20" />

          {/* Content */}
          <div className="relative flex h-full flex-col justify-center p-8 text-white animate-slide-in-right">
            <div className="max-w-sm">
              <h2 className="mb-4 text-3xl font-bold leading-tight">
                Chào mừng đến với
                <br />
                <span className="text-yellow-300 animate-pulse">Halora Cosmestic</span>
              </h2>

              <p className="mb-6 text-base text-blue-100">
                Nền tảng thương mại điện tử toàn diện, mang đến trải nghiệm mua
                sắm và quản lý tuyệt vời.
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-blue-100 text-sm">
                    Mua sắm thông minh & tiện lợi
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-blue-100 text-sm">
                    Theo dõi đơn hàng realtime
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-blue-100 text-sm">
                    Hỗ trợ 24/7 tận tâm
                  </span>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm animate-float" />
            <div className="absolute -bottom-12 -left-12 h-24 w-24 rounded-full bg-yellow-300/20 backdrop-blur-sm animate-float-delayed" />

            {/* Additional decorative elements */}
            <div
              className="absolute top-1/4 right-1/4 h-12 w-12 rounded-full bg-pink-300/20 backdrop-blur-sm animate-float"
              style={{ animationDelay: "1s" }}
            />
            <div className="absolute bottom-1/3 left-1/3 h-8 w-8 rounded-full bg-blue-300/30 backdrop-blur-sm animate-float-delayed" />
          </div>
        </div>
      </div>
    </div>
  );
}
