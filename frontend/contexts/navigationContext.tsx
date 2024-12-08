"use client";

import { createContext, useContext, useState } from "react";

interface NavigationContextProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

const NavigationContext = createContext<NavigationContextProps | undefined>(
  undefined,
);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  return (
    <NavigationContext.Provider value={{ isCollapsed, toggleCollapse }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextProps => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
