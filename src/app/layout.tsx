import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Halora Admin",
  description: "Admin dashboard for Halora",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}
