"use client";

import {
  createSchedule,
  getScheduleList,
  updateSchedule,
} from "@/pages/api/schedule";
import { Spinner } from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type HourData = {
  hour: number;
  isActive: boolean;
  id: string | null;
};

const hourGroups = [
  { title: "새벽", hours: [0, 1, 2, 3, 4, 5] },
  { title: "오전", hours: [6, 7, 8, 9, 10, 11] },
  { title: "오후", hours: [12, 13, 14, 15, 16, 17] },
  { title: "저녁", hours: [18, 19, 20, 21, 22, 23] },
];

export default function OnTime() {
  const queryClient = useQueryClient();
  const queryKey = "on_time";

  const {
    data: hours,
    isLoading,
    isError,
  } = useQuery<HourData[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await getScheduleList("recurring", "on_time");
      const initialHours: HourData[] = Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        isActive: false,
        id: null,
      }));

      response.forEach((item) => {
        const hour = parseInt(item.interval.split(" ")[1], 10);
        if (hour >= 0 && hour < 24) {
          initialHours[hour] = {
            hour: hour,
            isActive: item.active,
            id: item.id,
          };
        }
      });
      return initialHours;
    },
  });

  const { mutate: toggleHour } = useMutation({
    mutationFn: async ({ hour, isActive, id }: HourData) => {
      let meridiem = "오전";
      let speakHour = hour;

      if (hour >= 0 && hour < 6) meridiem = "새벽";
      else if (hour >= 12) {
        speakHour = hour === 12 ? 12 : hour - 12;
        meridiem = hour < 18 ? "오후" : "밤";
      }

      const title = `정각 알림 - ${hour}시`;
      const command = `현재 시각은 ${meridiem} ${speakHour}시 입니다.`;
      const interval = `0 ${hour} * * *`;

      if (id) {
        await updateSchedule(id, { active: !isActive });
      } else {
        await createSchedule("recurring", "on_time", title, command, interval);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const { mutate: toggleAllHours } = useMutation({
    mutationFn: async (activate: boolean) => {
      const promises = hours?.map((hourData) => {
        if (hourData.isActive !== activate) {
          return toggleHour(hourData);
        }
        return Promise.resolve();
      });
      await Promise.all(promises || []);
    },
  });

  if (isLoading) {
    return (
      <div className="grow flex justify-center items-center">
        <Spinner size="lg" label="로딩 중.." />
      </div>
    );
  }

  if (isError || !hours) {
    return <h1>오류가 발생했습니다.</h1>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              24시간 정각 알림
            </h1>
            <p className="mt-1 text-gray-600">
              각 시간별 알림을 켜고 끌 수 있습니다.
            </p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <button
              onClick={() => toggleAllHours(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              전체 선택
            </button>
            <button
              onClick={() => toggleAllHours(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              전체 해제
            </button>
          </div>
        </div>

        {hourGroups.map((group) => (
          <div key={group.title} className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
              {group.title}
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {group.hours.map((hour) => {
                const hourData = hours[hour];
                return (
                  <div
                    key={hour}
                    className="flex flex-col items-center justify-center p-2 border rounded-lg"
                  >
                    <span className="font-semibold text-gray-800">
                      {hour}시
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={hourData.isActive}
                        onChange={() => toggleHour(hourData)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
