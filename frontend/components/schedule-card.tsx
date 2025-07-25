"use client";

import { deleteSchedule, updateSchedule } from "@/pages/api/schedule";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScheduleList } from "Type";
import parser from "cron-parser";
import Modal from "./popup";
import { useState } from "react";
import { TrashIcon, ClockIcon } from "@heroicons/react/24/outline";

interface ScheduleProps {
  queryId: string;
  id: ScheduleList["id"];
  title: ScheduleList["title"];
  type: ScheduleList["type"];
  interval: ScheduleList["interval"];
  command: ScheduleList["tasks"];
  active: ScheduleList["active"];
  removeOnComplete: ScheduleList["removeOnComplete"];
}

export const toSimpleDate = (date: Date) => {
  if (!(date instanceof Date)) {
    return "";
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${minutes}`;
};

export const parseCronExpression = (expression: string) => {
  try {
    const interval = parser.parseExpression(expression);
    return toSimpleDate(interval.next().toDate());
  } catch (err) {
    console.error("Error parsing cron expression:", err);
    return [];
  }
};

export const describeCronExpression = (expression: string) => {
  try {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = expression.split(" ");

    const time = `${hour === "*" ? "매시간" : `${hour.padStart(2, "0")}시`} ${
      minute === "*" ? "매분" : `${minute.padStart(2, "0")}분`
    }`;

    let schedule = "";

    if (dayOfWeek !== "*") {
      const dayNumbers = dayOfWeek
        .split(",")
        .map((d) => parseInt(d))
        .sort((a, b) => a - b);
      const daySet = new Set(dayNumbers);

      if (daySet.size === 7) {
        schedule = "매일";
      } else if (
        daySet.size === 5 &&
        [1, 2, 3, 4, 5].every((day) => daySet.has(day))
      ) {
        schedule = "매주 주중";
      } else if (daySet.size === 2 && [0, 6].every((day) => daySet.has(day))) {
        schedule = "매주 주말";
      } else {
        const days = ["일", "월", "화", "수", "목", "금", "토"];
        schedule = `매주 ${dayNumbers.map((d) => days[d]).join(", ")}`;
      }
    } else if (dayOfMonth !== "*") {
      schedule = `매월 ${dayOfMonth}일`;
    } else if (month !== "*") {
      schedule = `${month}월`;
    } else {
      schedule = "매일";
    }

    return `${schedule} ${time}`;
  } catch (err) {
    console.error("Error parsing cron expression:", err);
    return "Invalid cron expression";
  }
};

export default function ScheduleCard({
  queryId,
  id,
  title,
  type,
  interval,
  command,
  active,
  removeOnComplete,
}: ScheduleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const displayTime = type === "one_time" ? parseCronExpression(interval) : describeCronExpression(interval);

  const queryClient = useQueryClient();
  const { mutate: handleDelete } = useMutation({
    mutationFn: () => deleteSchedule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete schedule:", error),
  });

  const { mutate: handleActiveToggle } = useMutation({
    mutationFn: () => updateSchedule(id, { active: !active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to update schedule:", error),
  });

  return (
    <>
      <div
        onClick={openModal}
        className="flex items-center p-4 my-2 bg-white shadow-md rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 h-32"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleActiveToggle();
          }}
          className={`w-4 h-4 rounded-full mr-4 flex-shrink-0 ${
            active ? "bg-green-500" : "bg-gray-300"
          }`}
        ></div>
        <div className="flex flex-col justify-between flex-grow min-w-0 h-full py-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-800 truncate">
                {title}
              </h2>
              {type === "recurring" ? (
                <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  루틴
                </span>
              ) : (
                <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  이벤트
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1 truncate">{command}</p>
          </div>
          <div className="flex items-center">
            <div className="flex items-center text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              <ClockIcon className="w-4 h-4 mr-1 text-gray-500" />
              <span>{displayTime}</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="p-2 text-gray-400 hover:text-red-500 ml-auto flex-shrink-0 self-center"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </div>
      {isModalOpen && (
        <Modal
          onClose={closeModal}
          queryId={queryId}
          type={type}
          schedule={{
            id,
            title,
            type,
            interval,
            command,
            active,
            removeOnComplete,
          }}
        >
          {type === "recurring" ? "루틴 수정하기" : "이벤트 수정하기"}
        </Modal>
      )}
    </>
  );
}
