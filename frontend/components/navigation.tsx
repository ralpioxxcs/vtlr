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
    <nav
      className={`${isCollapsed ? "w-12" : "w-64"}
         bg-slate-800 text-white h-full fixed top-0 left-0 transition-all duration-300 overflow-hidden`}
    >
      <p className="px-2 py-4">
        <button
          type="button"
          onClick={toggleCollapse}
          className="px-1 text-white text-2xl focus:outline-none"
        >
          {isCollapsed ? <Menu /> : <MenuOpen />}
        </button>
      </p>

      <ul className="mt-4 space-y-2">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className={`block px-2 py-2 whitespace-pre ${
                pathname === item.path ? "bg-slate-600" : "hover:bg-slate-700"
              }`}
            >
              <button
                type="button"
                className="px-1 flex gap-4 items-center h-7"
              >
                {item.icon}
                {!isCollapsed && (
                  <span className="text-lg text-gray-300">{item.label}</span>
                )}
              </button>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};
