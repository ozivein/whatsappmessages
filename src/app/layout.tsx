import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bizim Hikayemiz ❤️",
  description: "Oğuzhan & Şüheda WhatsApp Anı Kapsülü",
  applicationName: "Bizim Hikayemiz",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Hikayemiz",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#202c33",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className="dark h-full">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Hikayemiz" />
      </head>
      <body className="h-full w-full bg-[#0b141a] text-[#e9edef] antialiased selection:bg-[#00a884] selection:text-white overflow-hidden overscroll-none">
        {children}
      </body>
    </html>
  );
}