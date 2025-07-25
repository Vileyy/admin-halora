import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">{children}</main>
        <Toaster />
      </div>
    </div>
  );
}
