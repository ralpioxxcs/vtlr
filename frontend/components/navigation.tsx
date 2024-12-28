"use client";

import Link from "next/link";
import { useNavigation } from "@/contexts/navigationContext";
import { usePathname } from "next/navigation";

import HomeIcon from "@mui/icons-material/Home";
import ScheduleIcon from "@mui/icons-material/Schedule";
import EventIcon from "@mui/icons-material/Event";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import SettingsIcon from "@mui/icons-material/Settings";
import { Menu, MenuOpen } from "@mui/icons-material";
import { Button } from "@nextui-org/react";

export const Navigation = () => {
  const { isCollapsed, toggleCollapse } = useNavigation();

  const navItems = [
    { label: "홈", path: "/", icon: <HomeIcon /> },
    { label: "루틴", path: "/routine", icon: <ScheduleIcon /> },
    { label: "이벤트", path: "/event", icon: <EventIcon /> },
    { label: "정각알림", path: "/on-time", icon: <AccessAlarmIcon /> },
    { label: "할일", path: "/task", icon: <PlaylistAddCheckIcon /> },
    { label: "설정", path: "/setting", icon: <SettingsIcon /> },
  ];

  const pathname = usePathname();

  return (
    <nav
      className={`${isCollapsed ? "w-14" : "w-64"}
         bg-slate-800 text-white h-full fixed top-0 left-0 overflow-hidden transition-all duration-100`}
    >
      <p className="px-2 py-4">
        <Button
          variant="light"
          isIconOnly
          onPress={toggleCollapse}
          className="text-white text-xl focus:outline-none"
        >
          <Menu />
        </Button>
      </p>

      <ul className="space-y-0">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className={`block w-full rounded-xl ${
                pathname === item.path ? "bg-slate-600" : "hover:bg-slate-700"
              }`}
            >
                     <button
              type="button"
              className={`flex w-full ${
                isCollapsed
                  ? "flex-col items-center justify-center h-16"
                  : "items-center gap-4 h-12 px-4"
              }`}
            >
                {item.icon}
                {isCollapsed && (
                  <span className="text-xs text-gray-400 mt-1">
                    {item.label}
                  </span>
                )}
                {!isCollapsed && (
                  <span className="text-sm text-gray-300 mt-1">
                    {item.label}
                  </span>
                )}
              </button>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
