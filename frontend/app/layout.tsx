import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ClientProvider } from "@/components/ClientProvider";

export const metadata: Metadata = {
  title: "Vutler",
  description: "Your personal home assistant",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also supported but less commonly used
  // interactiveWidget: 'resizes-visual',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-[Arial,sans-serif]">
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
