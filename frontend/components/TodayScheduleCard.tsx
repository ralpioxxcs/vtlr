"use client";

import { useState } from "react";
import { Mic, YouTube } from "@mui/icons-material";
import TodayScheduleModal from "./TodayScheduleModal";

interface TodayScheduleCardProps {
  queryId: string;
  schedule: any;
}

const ActionBadge = ({ config }: { config: any }) => {
  if (!config) {
    return null;
  }

  const baseBadgeStyle =
    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-bold"; // Smaller padding

  switch (config.type) {
    case "TTS":
      return (
        <span className={`${baseBadgeStyle} bg-blue-100 text-blue-700`}>
          <Mic sx={{ fontSize: 12 }} /> {/* Smaller icon */}
          TTS
        </span>
      );
    case "YOUTUBE":
      return (
        <span className={`${baseBadgeStyle} bg-red-100 text-red-700`}>
          <YouTube sx={{ fontSize: 12 }} /> {/* Smaller icon */}
          YouTube
        </span>
      );
    default:
      return (
        <span className={`${baseBadgeStyle} bg-gray-100 text-gray-700`}>
          알 수 없음
        </span>
      );
  }
};

export default function TodayScheduleCard({ queryId, schedule }: TodayScheduleCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div
        onClick={openModal}
        className={`flex items-center p-2 my-1 bg-white shadow-sm rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-300 ${!schedule.active && "opacity-50"}`} // Smaller padding and margin
      >
        <div className="flex flex-col flex-grow min-w-0">
          <h2 className="text-sm font-semibold text-gray-800 truncate"> {/* Smaller font */}
            {schedule.title}
          </h2>
          <div className="flex items-center mt-1"> {/* Reduced margin-top */}
            <ActionBadge config={schedule.action_config} />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <TodayScheduleModal onClose={closeModal} schedule={schedule} />
      )}
    </>
  );
}