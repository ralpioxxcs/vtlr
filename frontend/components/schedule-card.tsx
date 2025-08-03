"use client";

import { updateSchedule, deleteSchedule } from "@/pages/api/schedule";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ClockIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Mic, YouTube } from "@mui/icons-material";
import ScheduleFormModal from "./ScheduleFormModal";

interface ScheduleProps {
  queryId: string;
  schedule: any;
}

const ActionBadge = ({ config }: { config: any }) => {
  if (!config) {
    return null;
  }

  const baseBadgeStyle =
    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold";

  switch (config.type) {
    case "TTS":
      return (
        <span className={`${baseBadgeStyle} bg-blue-100 text-blue-700`}>
          <Mic sx={{ fontSize: 16 }} />
          TTS
        </span>
      );
    case "YOUTUBE":
      return (
        <span className={`${baseBadgeStyle} bg-red-100 text-red-700`}>
          <YouTube sx={{ fontSize: 16 }} />
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

const formatScheduleTime = (config: any) => {
  if (!config) return "시간 정보 없음";
  try {
    switch (config.type) {
      case "ONE_TIME":
        const date = new Date(config.datetime);
        return date.toLocaleString("ko-KR", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
      case "RECURRING":
        return `매주 ${config.days.join(", ")} ${config.time.substring(0, 5)}`;
      case "HOURLY":
        return `매시간 ${config.time.split(":")[1]}분`;
      default:
        return "알 수 없는 스케줄";
    }
  } catch (error) {
    return "시간 형식 오류";
  }
};

export default function ScheduleCard({ queryId, schedule }: ScheduleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClosed, setIsCloseClick] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsCloseClick(true);
    setIsModalOpen(false);
  };

  const displayTime = formatScheduleTime(schedule.schedule_config);

  const queryClient = useQueryClient();

  const { mutate: handleActiveToggle } = useMutation({
    mutationFn: () => updateSchedule(schedule.id, { active: !schedule.active }),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [queryId] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData([queryId]);

      // Optimistically update to the new value
      queryClient.setQueryData([queryId], (oldData: any[] | undefined) => {
        if (!oldData) return [];
        return oldData.map((item) =>
          item.id === schedule.id ? { ...item, active: !item.active } : item,
        );
      });

      // Return a context object with the snapshotted value
      return { previousData };
    },
    // If the mutation fails, use the context we returned above
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData([queryId], context.previousData);
      }
    },
    // Always refetch after error or success, to ensure client state is consistent
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [queryId] });
    },
  });

  const { mutate: handleDelete } = useMutation({
    mutationFn: () => deleteSchedule(schedule.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["main"] });
      queryClient.invalidateQueries({ queryKey: ["routine"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
    },
    onError: (error) => {
      alert(`삭제 중 오류가 발생했습니다: ${error.message}`);
    },
  });

  return (
    <>
      <div
        onClick={openModal}
        className={`flex items-center p-4 my-2 bg-white shadow-sm rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-300 ${!schedule.active && "opacity-50"}`}
      >
        <div
          onClick={(e) => {
            handleActiveToggle();
          }}
          className={`w-5 h-5 rounded-full mr-4 flex-shrink-0 transition-colors ${
            schedule.active
              ? "bg-green-500 hover:bg-green-600"
              : "bg-gray-300 hover:bg-gray-400"
          }`}
        ></div>
        <div className="flex flex-col flex-grow min-w-0">
          <h2 className="text-base font-semibold text-gray-800 truncate">
            {schedule.title}
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <ActionBadge config={schedule.action_config} />
            <div className="flex items-center text-xs text-gray-500">
              <ClockIcon className="w-4 h-4 mr-1" />
              <span>{displayTime}</span>
            </div>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm("정말로 이 스케줄을 삭제하시겠습니까?")) {
              handleDelete();
            }
          }}
          className="ml-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <TrashIcon className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {isModalOpen && !isClosed && (
        <ScheduleFormModal onClose={closeModal} schedule={schedule} />
      )}
    </>
  );
}
