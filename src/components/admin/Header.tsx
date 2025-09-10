"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { signOutUser } from "@/services/authService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function Header() {
  const router = useRouter();
  const { userData } = useAuth();

  const handleLogout = async () => {
    try {
      await signOutUser();
      toast.success("Đăng xuất thành công!");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất");
    }
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Halora Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          {userData && (
            <div className="text-sm">
              <span className="text-muted-foreground">Chào mừng, </span>
              <span className="font-medium">{userData.email}</span>
              {userData.role === "admin" && (
                <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                  Admin
                </span>
              )}
            </div>
          )}
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
