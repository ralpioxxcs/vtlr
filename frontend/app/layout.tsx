"use client";

import "./globals.css";
import {
  NavigationProvider,
  useNavigation,
} from "@/contexts/navigationContext";
import { TanstackQueryProvider } from "@/contexts/tanstackQueryContext";
import { Navigation } from "@/components/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed } = useNavigation();

  return (
    <div className="flex h-screen">
      <Navigation />
      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? "ml-16" : "ml-64"
        } p-2`}
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
        <NavigationProvider>
          <TanstackQueryProvider>
            <Layout>{children}</Layout>
          </TanstackQueryProvider>
        </NavigationProvider>
      </body>
    </html>
  );
};

export default RootLayout;
