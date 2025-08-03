"use client";

import { useEffect, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { NavigationProvider } from "@/contexts/navigationContext";
import { TanstackQueryProvider } from "@/contexts/tanstackQueryContext";
import { HeroUIProvider } from "@heroui/react";
import { Sidebar } from "@/components/sidebar";
import CreateScheduleFab from "@/components/CreateScheduleFab";
import MenuIcon from "@mui/icons-material/Menu";
import { Button } from "@heroui/react";

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
      <div className="fixed top-0 left-0 w-full bg-zinc-800 text-white h-10 flex items-center shadow-md z-50 justify-between">
        <h1 className="px-4 text-left text-xl font-bold">Vutler</h1>
        <Button
          variant="light"
          isIconOnly
          onPress={toggleNav}
          className="text-white text-2xl px-4 focus:outline-none"
        >
          <MenuIcon />
        </Button>
      </div>
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
          className={`flex-1 flex flex-col p-4 transition-all duration-300 ${
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
    <HeroUIProvider locale="ko-KR" >
      <NavigationProvider>
        <TanstackQueryProvider>
          <Layout>{children}</Layout>
        </TanstackQueryProvider>
      </NavigationProvider>
    </HeroUIProvider>
  );
}
