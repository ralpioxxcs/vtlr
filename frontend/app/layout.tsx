import type { Metadata } from "next";
import "./globals.css";
import { ClientProvider } from "@/components/ClientProvider";

export const metadata: Metadata = {
  title: "Vutler",
  description: "Your personal home assistant",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

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
