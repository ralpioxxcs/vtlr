"use client";

import { deleteSchedule, updateSchedule } from "@/pages/api/schedule";
import { Chip } from "@nextui-org/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScheduleList } from "Type";
import parser from "cron-parser";

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
      const days = [
        "일요일",
        "월요일",
        "화요일",
        "수요일",
        "목요일",
        "금요일",
        "토요일",
      ];
      schedule = `매주 ${dayOfWeek
        .split(",")
        .map((d) => days[parseInt(d)])
        .join(", ")}`;
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
  const nextExecDate = parseCronExpression(interval);
  const cron = describeCronExpression(interval);

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

  const { mutate: handleRemoveToggle } = useMutation({
    mutationFn: () =>
      updateSchedule(id, { removeOnComplete: !removeOnComplete }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to update schedule:", error),
  });

  return (
    <div className="relative w-full h-full mx-auto my-2 bg-white shadow-lg rounded-lg border border-slate-400 overflow-hidden">
      <button
        type="button"
        onClick={() => handleDelete()}
        className="absolute top-2 right-2 text-gray-300 hover:text-gray-700 text-xl font-bold"
      >
        &times;
      </button>
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-600 mt-2">{command}</p>

        {/* Details */}
        <div className="mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">유형:</span>
            <span className="text-sm font-medium text-gray-700">
              {type === "recurring" ? (
                <Chip size="sm" color="danger" radius="md" variant="flat">
                  루틴
                </Chip>
              ) : (
                <Chip size="sm" color="warning" radius="md" variant="flat">
                  이벤트
                </Chip>
              )}
            </span>
          </div>

          {
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500 w-28">
                다음 실행될 시간:
              </span>
              <span className="text-sm font-medium text-gray-700">
                {nextExecDate}
              </span>
            </div>
          }

          {type === "recurring" && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500 w-24">반복 주기:</span>
              <span className="text-sm font-medium text-gray-700 text-right">
                {cron}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <label htmlFor="toggle" className="text-sm text-gray-500">
              활성화:
            </label>
            <button
              type="button"
              id="toggle"
              onClick={() => handleActiveToggle()}
              className={`w-8 h-4 flex items-center rounded-full cursor-pointer p-1 transition-colors ${
                active ? "bg-teal-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${
                  active ? "translate-x-3.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {type === "one_time" && (
            <div className="flex justify-between items-center mt-2">
              <label htmlFor="toggle" className="text-sm text-gray-500">
                자동 삭제:
              </label>
              <button
                type="button"
                id="toggle"
                onClick={() => handleRemoveToggle()}
                className={`w-8 h-4 flex items-center rounded-full cursor-pointer p-1 transition-colors ${
                  removeOnComplete ? "bg-teal-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${
                    removeOnComplete ? "translate-x-3.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
