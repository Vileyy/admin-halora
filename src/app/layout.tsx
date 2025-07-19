import Sidebar from "@/components/admin/Sidebar";
import Header from "@/components/admin/Header";
import "./globals.css";

export const metadata = {
  title: "Halora Admin",
  description: "Admin dashboard for Halora Cosmetics",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
