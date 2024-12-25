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

export const Navigation = () => {
  const { isCollapsed, toggleCollapse } = useNavigation();

  const navItems = [
    { label: "Home", path: "/", icon: <HomeIcon /> },
    { label: "Routine", path: "/routine", icon: <ScheduleIcon /> },
    { label: "Event", path: "/event", icon: <EventIcon /> },
    { label: "On-Time", path: "/on-time", icon: <AccessAlarmIcon /> },
    { label: "Task (준비 중)", path: "/task", icon: <PlaylistAddCheckIcon /> },
    { label: "Setting (준비 중)", path: "/setting", icon: <SettingsIcon /> },
  ];

  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      <nav
        className={`${isCollapsed ? "w-16" : "w-64"}
         bg-slate-900 text-white h-full fixed top-0 left-0 transition-all duration-300 z-4`}
      >
        <div className="flex items-center justify-between p-4">
          <button
            onClick={toggleCollapse}
            className="text-white text-2xl focus:outline-none"
          >
            {isCollapsed ? <Menu /> : <MenuOpen />}
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`flex items-center gap-4 px-4 py-2 rounded ${
                  pathname === item.path ? "bg-slate-700" : "hover:bg-slate-800"
                }`}
              >
                <span className="text-3xl">{item.icon}</span>
                {!isCollapsed && (
                  <span className="text-lg font-semibold text-gray-300">
                    {item.label}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
