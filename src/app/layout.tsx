import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0B1E36",
};

export const metadata: Metadata = {
  title: "BAS Advertising — Portal Manajemen & Operasional",
  description: "Portal internal terpadu BAS Advertising: Manajemen Produk, Pesanan, Pembayaran, Driver, dan Vendor.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-[#0B1E36] text-white min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
