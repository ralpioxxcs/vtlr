"use client";

import CreateButton from "@/components/create-schedule";
import ScheduleCard from "@/components/schedule-card";
import { getScheduleList } from "@/pages/api/schedule";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

export default function EventPage() {
  const queryId = "event";
  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: () => getScheduleList("one_time", "event"),
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
      <h1 className="text-xl font-semibold mb-4 text-center">내 이벤트</h1>
      {data && data.length > 0 ? (
        <div className="space-y-2">
          {data.map((schedule: any) => (
            <ScheduleCard
              key={schedule.id}
              queryId={queryId}
              id={schedule.id}
              title={schedule.title}
              type={schedule.type}
              interval={schedule.interval}
              command={schedule.tasks[0].text}
              active={schedule.active}
              removeOnComplete={schedule.removeOnComplete}
            />
          ))}
        </div>
      ) : (
        <div className="grow content-center self-center bg-gray-100 text-gray-800">
          <div className="text-2xl text-gray-600">
            <p>이벤트가 없습니다. 새로운 이벤트를 생성하세요</p>
          </div>
        </div>
      )}
      <div>
        <CreateButton
          queryId={queryId}
          title="새로운 이벤트"
          scheduleType="one_time"
        />
      </div>
    </div>
  );
}
