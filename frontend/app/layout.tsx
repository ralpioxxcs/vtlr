"use client";

import "./globals.css";
import {
  NavigationProvider,
  useNavigation,
} from "@/contexts/navigationContext";
import { TanstackQueryProvider } from "@/contexts/tanstackQueryContext";
import { Navigation } from "@/components/navigation";
import { NextUIProvider } from "@nextui-org/react";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed } = useNavigation();

  return (
    <div className="flex min-h-dvh">
      <Navigation />
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? "ml-12" : "ml-64"
        }`}
      >
        {children}
      </main>
    </div>
  );
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className="font-[Arial,sans-serif]">
        <NextUIProvider>
          <NavigationProvider>
            <TanstackQueryProvider>
              <Layout>{children}</Layout>
            </TanstackQueryProvider>
          </NavigationProvider>
        </NextUIProvider>
      </body>
    </html>
  );
};

export default RootLayout;
