import "@/app/globals.css";
import { Toaster } from "@/components/ui/sonner";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {children}
      <Toaster />
    </div>
  );
}
