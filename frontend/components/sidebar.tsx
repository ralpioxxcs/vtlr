"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import HomeIcon from "@mui/icons-material/Home";
import ScheduleIcon from "@mui/icons-material/Schedule";
import EventIcon from "@mui/icons-material/Event";
import AccessAlarmIcon from "@mui/icons-material/AccessAlarm";

import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import SettingsIcon from "@mui/icons-material/Settings";

export const Sidebar = ({
  isNavVisible,
  toggleNav,
}: {
  isNavVisible: boolean;
  toggleNav: () => void;
}) => {
  const pathname = usePathname();

  const navItems = [
    { label: "홈", path: "/", icon: <HomeIcon /> },
    { label: "루틴", path: "/routine", icon: <ScheduleIcon /> },
    { label: "이벤트", path: "/event", icon: <EventIcon /> },
    { label: "정각알림", path: "/on-time", icon: <AccessAlarmIcon /> },
    { label: "할일", path: "/task", icon: <PlaylistAddCheckIcon /> },
    { label: "설정", path: "/setting", icon: <SettingsIcon /> },
  ];

  return (
    <nav
      className={`${
        isNavVisible ? "translate-x-0" : "translate-x-full"
      } fixed top-0 right-0 bg-zinc-800 text-white h-full w-14 shadow-lg transition-transform duration-300 z-40`}
    >
      <ul className="space-y-0 mt-12">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link
              href={item.path}
              className={`block w-full rounded-xl ${
                pathname === item.path ? "bg-zinc-600" : "hover:bg-zinc-700"
              }`}
            >
              <button
                type="button"
                className={`flex w-full ${
                  isNavVisible
                    ? "flex-col items-center justify-center h-16"
                    : "items-center gap-4 h-12 px-4"
                }`}
              >
                {item.icon}
                {isNavVisible && (
                  <span className="text-xs text-gray-400 mt-1">
                    {item.label}
                  </span>
                )}
                {!isNavVisible && (
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
