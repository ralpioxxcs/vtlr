"use client";

import "./globals.css";
import { NavigationProvider } from "@/contexts/navigationContext";
import { TanstackQueryProvider } from "@/contexts/tanstackQueryContext";
import { NextUIProvider } from "@nextui-org/react";
import { Header } from "@/components/header";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isNavVisible, setIsNavVisible] = useState(false);

  const toggleNav = () => {
    setIsNavVisible((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleNav={toggleNav} />

      <div className="flex-1 flex relative">
        <Sidebar isNavVisible={isNavVisible} toggleNav={toggleNav} />

        <main
          className={`flex-1 flex flex-col mt-10 transition-all duration-300 ${
            isNavVisible ? "mr-14" : "mr-0"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.ico" sizes="any" />
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
