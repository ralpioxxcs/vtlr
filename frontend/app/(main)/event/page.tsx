"use client";

import CreateButton from "@/components/create-schedule";
import ScheduleCard from "@/components/schedule-card";
import { getScheduleList } from "@/pages/api/schedule";
import { useQuery } from "@tanstack/react-query";

export default function EventPage() {
  const queryId = "event";
  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: () => getScheduleList("one_time", "event"),
  });

  if (isLoading) {
    return <h1>Loading...</h1>;
  }

  if (isError) {
    return <h1>Error</h1>;
  }

  return (
    <div className="grow p-4 flex flex-col">
      <h1 className="text-3xl font-bold mb-4">My events</h1>
      {data && data.length > 0 ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {data.map((schedule) => (
            <ScheduleCard
              key={schedule.rowId}
              queryId={queryId}
              id={schedule.rowId}
              title={schedule.title}
              description={schedule.description}
              type={schedule.type}
              interval={schedule.interval}
              active={schedule.active}
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
          title="New event"
          scheduleType="one_time"
        />
      </div>
    </div>
  );
}
