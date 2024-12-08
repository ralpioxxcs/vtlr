import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = {
  title: {
    template: "%s | Vutler",
    default: "Please wait..",
  },
  description: "Vutler",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        <div className="flex">
          <Navigation />
          <main className="flex-1 ml-auto p-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
