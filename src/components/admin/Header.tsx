"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function Header() {
  const router = useRouter();

  const handleLogout = () => {
    // Xóa cookie
    document.cookie =
      "auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">Halora Admin</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
