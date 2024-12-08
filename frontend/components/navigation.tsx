"use client";

import { useNavigation } from "@/contexts/navigationContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CiSettings } from "react-icons/ci";
import { FaHome } from "react-icons/fa";
import { GoTasklist } from "react-icons/go";
import { MdEventAvailable } from "react-icons/md";
import { PiClockCounterClockwise } from "react-icons/pi";
import {
  TbLayoutSidebarLeftCollapse,
  TbLayoutSidebarRightCollapse,
} from "react-icons/tb";
import { TfiAlarmClock } from "react-icons/tfi";

export const Navigation = () => {
  const { isCollapsed, toggleCollapse } = useNavigation();

  const navItems = [
    { label: "홈", path: "/", icon: <FaHome /> },
    { label: "내 루틴", path: "/routine", icon: <PiClockCounterClockwise /> },
    { label: "이벤트", path: "/event", icon: <MdEventAvailable /> },
    { label: "정각 알림 (준비 중)", path: "/on-time", icon: <TfiAlarmClock /> },
    { label: "태스크 (준비 중)", path: "/task", icon: <GoTasklist /> },
    { label: "설정 (준비 중)", path: "/setting", icon: <CiSettings /> },
  ];

  const pathname = usePathname();

  return (
    <div className="flex h-screen">
      <nav
        className={`${isCollapsed ? "w-16" : "w-64"}
         bg-zinc-700 text-white h-full fixed top-0 left-0 transition-all duration-300 z-4`}
      >
        <div className="flex items-center justify-between p-4">
          <button
            onClick={toggleCollapse}
            className="text-white text-2xl focus:outline-none"
          >
            {isCollapsed ? (
              <TbLayoutSidebarRightCollapse />
            ) : (
              <TbLayoutSidebarLeftCollapse />
            )}
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`flex items-center gap-4 px-4 py-2 rounded ${
                  pathname === item.path ? "bg-slate-600" : "hover:bg-slate-700"
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};
