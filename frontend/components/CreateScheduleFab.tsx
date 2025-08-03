"use client";

import { useState } from "react";
import { Button } from "@heroui/react";
import AddIcon from "@mui/icons-material/Add";
import ScheduleFormModal from "./ScheduleFormModal";
import TodayScheduleModal from "./TodayScheduleModal";
import { usePathname } from "next/navigation";

export default function CreateScheduleFab() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pathname = usePathname();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const fabStyle: React.CSSProperties = {
    position: "fixed",
    bottom: "1rem",
    right: "1rem",
    zIndex: 50,
  };

  return (
    <>
      <div style={fabStyle}>
        <Button
          isIconOnly
          radius="full"
          size="lg"
          className="bg-gradient-to-tr from-slate-500 to-slate-900 hover:from-red-400 hover:to-red-900 text-white shadow-lg"
          onPress={openModal}
        >
          <AddIcon />
        </Button>
      </div>
      {isModalOpen &&
        (pathname === "/today" ? (
          <TodayScheduleModal onClose={closeModal} />
        ) : (
          <ScheduleFormModal onClose={closeModal} />
        ))}
    </>
  );
}
