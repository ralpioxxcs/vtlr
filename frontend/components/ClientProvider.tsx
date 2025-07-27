"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { NavigationProvider } from "@/contexts/navigationContext";
import { TanstackQueryProvider } from "@/contexts/tanstackQueryContext";
import { HeroUIProvider } from "@heroui/react";
import { Header } from "@/components/header";
import { Sidebar } from "@/components/sidebar";
import CreateScheduleFab from "@/components/CreateScheduleFab";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isNavVisible, setIsNavVisible] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setIsNavVisible(true);
    } else {
      setIsNavVisible(false);
    }
  }, [isDesktop]);

  const toggleNav = () => {
    setIsNavVisible((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleNav={toggleNav} isDesktop={isDesktop} />
      <div className="flex-1 flex relative">
        <Sidebar
          isNavVisible={isNavVisible}
          toggleNav={toggleNav}
          isDesktop={isDesktop}
        />
        {!isDesktop && isNavVisible && (
          <div
            className="fixed inset-0 bg-black opacity-50 z-30"
            onClick={toggleNav}
          ></div>
        )}
        <main
          className={`flex-1 flex flex-col mt-10 transition-all duration-300 ${
            isDesktop ? "mr-14" : "mr-0"
          }`}
        >
          {children}
        </main>
        <CreateScheduleFab />
      </div>
    </div>
  );
};

export function ClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <NavigationProvider>
        <TanstackQueryProvider>
          <Layout>{children}</Layout>
        </TanstackQueryProvider>
      </NavigationProvider>
    </HeroUIProvider>
  );
}
