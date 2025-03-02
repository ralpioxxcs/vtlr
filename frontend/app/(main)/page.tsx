"use client";

import ScheduleCard from "@/components/schedule-card";
import { getScheduleList } from "@/pages/api/schedule";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const queryId = "main";
  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: async () => {
      const response = await getScheduleList();
      return response.filter((item) => item.category !== "on_time" && item.category !== "task");
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
    <div className="grow p-4 flex flex-col">
      <h1 className="text-xl font-semibold mb-4 text-center">모든 일정</h1>
      {data && data.length > 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {data.map((schedule: any) => (
            <ScheduleCard
              key={schedule.id}
              queryId={queryId}
              id={schedule.id}
              title={schedule.title}
              type={schedule.type}
              interval={schedule.interval}
              command={schedule.tasks[0].text} // FIXME:
              active={schedule.active}
              removeOnComplete={schedule.removeOnComplete}
            />
          ))}
        </div>
      ) : (
        <div className="grow flex justify-center items-center bg-gray-100 text-gray-800">
          <p className="text-2xl text-gray-600">스케줄이 없습니다</p>
        </div>
      )}
    </div>
  );
}
