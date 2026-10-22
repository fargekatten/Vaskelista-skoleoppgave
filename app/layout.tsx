import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Husarbeid – kollektivet",
  description: "Felles oppgaver, poeng og historikk for kollektivet.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Casa Caos",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb">
      <body className="antialiased">{children}</body>
    </html>
  );
}
