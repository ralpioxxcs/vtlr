"use client";

import "./globals.css";
import {
  NavigationProvider,
  useNavigation,
} from "@/contexts/navigationContext";
import { Navigation } from "@/components/navigation";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed } = useNavigation();

  return (
    <div className="flex h-screen">
      <Navigation />
      <main
        className={`flex-1 transition-all duration-300 ${
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
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        <NavigationProvider>
          <Layout>{children}</Layout>
        </NavigationProvider>
      </body>
    </html>
  );
};

export default RootLayout;
