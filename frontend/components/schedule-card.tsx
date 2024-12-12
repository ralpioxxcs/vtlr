"use client";

import {
  deleteSchedule,
  getScheduleList,
  updateSchedule,
} from "@/pages/api/schedule";
import parser from "cron-parser";
import { useState } from "react";

interface ScheduleProps {
  id: string;
  title: string;
  description: string;
  type: string;
  interval: string;
  active: boolean;
  setData: any;
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
  id,
  title,
  description,
  type,
  interval,
  active,
  setData,
}: ScheduleProps) {
  const nextExecDate = parseCronExpression(interval);
  const cron = describeCronExpression(interval);

  const handleDelete = async (id: string) => {
    try {
      await deleteSchedule(id);
    } catch (error) {
      console.error("Failed to delete schedule:", error);
    } finally {
    }
    const response = await getScheduleList(type);
    setData(response);
  };

  const handleToggle = async (id: string) => {
    try {
      await updateSchedule(id, {
        active: !active
      });
    } catch (error) {
      console.error("Failed to update schedule:", error);
    } finally {
    }
    const response = await getScheduleList(type);
    setData(response);
    //setIsOn(!active);
  };

  return (
    <div className="relative w-full h-full mx-auto my-2 bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden">
      {/* Delete button */}
      <button
        onClick={() => handleDelete(id)}
        className="absolute top-2 right-2 text-gray-300 hover:text-gray-700 text-xl font-bold"
      >
        &times;
      </button>
      <div className="p-4">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <p className="text-gray-500 mt-2">{description}</p>
        {/* Details */}
        <div className="mt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">유형:</span>
            <span className="text-sm font-medium text-gray-700">
              {type === "recurring" ? "루틴" : "이벤트"}
            </span>
          </div>

          {
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">다음 실행될 시간:</span>
              <span className="text-sm font-medium text-gray-700">
                {nextExecDate}
              </span>
            </div>
          }

          {type === "recurring" && (
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-gray-500">반복 주기:</span>
              <span className="text-sm font-medium text-gray-700">{cron}</span>
            </div>
          )}

          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">활성화:</span>

            <div
              onClick={() => handleToggle(id)}
              className={`w-8 h-4 flex items-center rounded-full cursor-pointer p-1 transition-colors ${
                active ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-3 h-3 bg-white rounded-full shadow-md transform transition-transform ${
                  active ? "translate-x-4" : "translate-x-0"
                }`}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
