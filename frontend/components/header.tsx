"use client";

import React from "react";
import MenuIcon from "@mui/icons-material/Menu";
import { Button } from "@nextui-org/react";

export const Header = ({ toggleNav }: { toggleNav: () => void }) => {
  return (
    <header className="fixed top-0 left-0 w-full bg-slate-800 text-white h-10 flex items-center shadow-md z-50">
      <h1 className="flex-1 text-center text-xl font-bold">Vutler</h1>
      <Button
        variant="light"
        isIconOnly
        onPress={toggleNav}
        className="text-white text-2xl px-6 focus:outline-none"
      >
        <MenuIcon />
      </Button>
    </header>
  );
};
