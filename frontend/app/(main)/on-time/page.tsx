"use client";

import {
  createSchedule,
  getScheduleList,
  updateSchedule,
} from "@/pages/api/schedule";
import { Spinner, Textarea } from "@nextui-org/react";
import { useMutation, useQuery } from "@tanstack/react-query";

export default function OnTime() {
  const queryKey = "on_time";

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await getScheduleList("recurring", "on_time");

      const hours = Array(24).fill(false);

      response.forEach((item) => {
        const hour = parseInt(item.interval.split(" ")[1], 10);
        const isActive = item.active;
        hours[hour] = isActive;
      });

      return hours;
    },
    initialData: () => Array(24).fill(false),
  });

  const { mutate: handleToggle } = useMutation({
    mutationFn: async (hour: number) => {
      data[hour] = !data[hour];

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
        hourList[+hour] = {
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
    },
  });

  if (isLoading) {
    return (
      <div className="grow flex justify-center items-center">
        <Spinner size="lg" label="로딩 중.." />
      </div>
    );
  }

  if (isError) {
    return <h1>Error</h1>;
  }

  return (
    <div className="grow flex justify-center items-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-4 w-full max-w-lg">
        <h1 className="text-xl font-semibold text-gray-800 text-center">
          24시간 정각 알림
        </h1>
        <p className="mt-2 text-gray-600 text-center">
          각 시간별 알림을 켜고 끌 수 있습니다.
        </p>

        <div className="mt-8">
          <h2 className="text-xl text-center font-semibold text-gray-700 mb-4">
            오전
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {data.slice(0, 12).map((isEnabled, hour) => (
              <div key={hour} className="text-center">
                <span className="block text-sm font-medium text-gray-700">
                  {hour}시
                </span>
                <label className="relative inline-flex items-center cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggle(hour)}
                    className="sr-only"
                  />
                  <div
                    className={`w-12 h-6 bg-gray-300 rounded-full shadow-inner transition-colors duration-300 ${
                      isEnabled ? "bg-indigo-700" : "bg-gray-300"
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
            {data.slice(12).map((isEnabled, hour) => (
              <div key={hour + 12} className="text-center">
                <span className="block text-sm font-medium text-gray-700">
                  {hour + 12}시
                </span>
                <label className="relative inline-flex items-center cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => handleToggle(hour + 12)}
                    className="sr-only"
                  />
                  <div
                    className={`w-12 h-6 bg-gray-300 rounded-full shadow-inner transition-colors duration-300 ${
                      isEnabled ? "bg-indigo-700" : "bg-gray-300"
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
