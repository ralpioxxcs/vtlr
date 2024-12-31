"use client";

import React from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { Button } from "@nextui-org/react";

import { Maven_Pro } from "next/font/google";

const mavenPro = Maven_Pro({ subsets: ["latin"], weight: "500" });

export const Header = ({ toggleNav }: { toggleNav: () => void }) => {
  return (
    <div className={mavenPro.className}>
      <header className="fixed top-0 left-0 w-full bg-zinc-800 text-white h-10 flex items-center shadow-md z-50">
        <h1 className="flex-1 px-6 text-left text-2xl font-bold">Vutler</h1>
        <Button
          variant="light"
          isIconOnly
          onPress={toggleNav}
          className="text-white text-2xl px-7 focus:outline-none"
        >
          <MenuIcon />
        </Button>
      </header>
    </div>
  );
};
