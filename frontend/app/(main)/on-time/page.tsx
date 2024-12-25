"use client";

import {
  createSchedule,
  getScheduleList,
  updateSchedule,
} from "@/pages/api/schedule";
import { Button, Textarea } from "@nextui-org/react";
import { useEffect, useState } from "react";

export default function OnTime() {
  const [notifications, setNotifications] = useState(
    Array.from({ length: 24 }, () => false),
  );

  const [allHoursText, setAllHoursText] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const onTimeScheduleList = await getScheduleList(
          "recurring",
          "on_time",
        );

        onTimeScheduleList.forEach(async (schedule) => {
          const hour = schedule.interval.split(" ")[1];
          const active = schedule.active;
          setNotifications((prev) => {
            const updated = [...prev];
            updated[hour] = active;
            return updated;
          });
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchInitialData();
  }, []);

  const toggleNotification = (hour: number) => {
    setNotifications((prev) => {
      const updated = [...prev];
      updated[hour] = !updated[hour];
      return updated;
    });
    syncDatas(hour);
  };

  const syncDatas = async (hour: number) => {
    const onTimeScheduleList = await getScheduleList("recurring", "on_time");
    const hourList: { active: boolean; rowId: string }[] = Array.from(
      { length: 24 },
      () => ({
        active: false,
        rowId: "",
      }),
    );

    for (const schedule of onTimeScheduleList) {
      const hour = schedule.interval.split(" ")[1];
      const rowId = schedule.rowId;
      const active = schedule.active;
      hourList[hour] = {
        active,
        rowId,
      };
    }

    if (!hourList[hour].active) {
      await createSchedule(
        "recurring",
        "on_time",
        `on_time_schedule_${hour}`,
        `현재 시각 ${hour}시 입니다.`,
        `0 ${hour} * * *`,
      );
    } else {
      await updateSchedule(hourList[hour].rowId, {
        active: !hourList[hour].active,
      });
    }
  };

  const toggleSelectAll = () => {
    setNotifications((prev) => {
      const newValue = !selectAll;
      setSelectAll(newValue);
      return prev.map(() => newValue);
    });

    notifications.forEach((_, index) => {
      toggleNotification(index);
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-4 w-full max-w-lg">
        <h1 className="text-xl font-semibold text-gray-800 text-center">
          24시간 정각 알림
        </h1>
        <p className="mt-2 text-gray-600 text-center">
          각 시간별 알림을 켜고 끌 수 있습니다.
        </p>

        {/*
        <div className="mt-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={toggleSelectAll}
              className="sr-only"
            />
            <div
              className={`w-8 h-5 bg-gray-300 rounded-full shadow-inner transition-colors duration-300 ${
                selectAll || notifications.every((item) => item)
                  ? "bg-rose-500"
                  : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                selectAll || notifications.every((item) => item)
                  ? "translate-x-3.5"
                  : "translate-x-0"
              }`}
            ></div>
          </label>
          <span className="ml-4 text-sm font-medium text-gray-700">
            전체 설정
          </span>
        </div>
        */}

        <div className="mt-8">
          <h2 className="text-xl text-center font-semibold text-gray-700 mb-4">
            오전
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {notifications.slice(0, 12).map((isEnabled, hour) => (
              <div key={hour} className="text-center">
                <span className="block text-sm font-medium text-gray-700">
                  {hour}시
                </span>
                <label className="relative inline-flex items-center cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleNotification(hour)}
                    className="sr-only"
                  />
                  <div
                    className={`w-12 h-6 bg-gray-300 rounded-full shadow-inner transition-colors duration-300 ${
                      isEnabled ? "bg-green-600" : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      isEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  ></div>
                </label>
              </div>
            ))}
          </div>

          <h2 className="text-xl text-center font-semibold text-gray-700 mt-8 mb-4">
            오후
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {notifications.slice(12).map((isEnabled, hour) => (
              <div key={hour + 12} className="text-center">
                <span className="block text-sm font-medium text-gray-700">
                  {hour + 12}시
                </span>
                <label className="relative inline-flex items-center cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleNotification(hour + 12)}
                    className="sr-only"
                  />
                  <div
                    className={`w-12 h-6 bg-gray-300 rounded-full shadow-inner transition-colors duration-300 ${
                      isEnabled ? "bg-green-600" : "bg-gray-300"
                    }`}
                  ></div>
                  <div
                    className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
                      isEnabled ? "translate-x-6" : "translate-x-0"
                    }`}
                  ></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <Textarea
            variant="flat"
            className="col-span-12 md:col-span-6 mb-6 md:mb-0"
            label="정각시 말할 문장"
            placeholder="현재 시각 OO시 입니다"
          />
        </div>
      </div>
    </div>
  );
}
