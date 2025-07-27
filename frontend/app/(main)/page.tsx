"use client";

import { useState, useMemo } from "react";
import ScheduleCard from "@/components/schedule-card";
import { getScheduleList } from "@/pages/api/schedule";
import { Spinner, Button } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";

type FilterType = "ALL" | "ROUTINE" | "EVENT";

export default function Home() {
  const queryId = "main";
  const [filter, setFilter] = useState<FilterType>("ALL");

  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: getScheduleList,
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    switch (filter) {
      case "ROUTINE":
        return data.filter(s => s.schedule_config?.type === 'RECURRING');
      case "EVENT":
        return data.filter(s => s.schedule_config?.type === 'ONE_TIME' || s.schedule_config?.type === 'HOURLY');
      case "ALL":
      default:
        return data;
    }
  }, [data, filter]);

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

  const FilterButtons = () => (
    <div className="flex justify-center gap-2 mb-4">
      <Button variant={filter === 'ALL' ? 'solid' : 'outline'} onPress={() => setFilter('ALL')}>전체</Button>
      <Button variant={filter === 'ROUTINE' ? 'solid' : 'outline'} onPress={() => setFilter('ROUTINE')}>루틴</Button>
      <Button variant={filter === 'EVENT' ? 'solid' : 'outline'} onPress={() => setFilter('EVENT')}>이벤트</Button>
    </div>
  );

  return (
    <div className="p-4 flex flex-col">
      <h1 className="text-xl font-semibold mb-4 text-center">모든 스케줄</h1>
      <FilterButtons />
      {filteredData && filteredData.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {filteredData.map((schedule: any) => (
            <ScheduleCard
              key={schedule.id}
              queryId={queryId}
              schedule={schedule}
            />
          ))}
        </div>
      ) : (
        <div className="grow flex justify-center items-center bg-gray-100 text-gray-800 rounded-lg min-h-[200px]">
          <p className="text-xl text-gray-500">
            {filter === 'ALL' ? '표시할 스케줄이 없습니다.' : `표시할 ${filter === 'ROUTINE' ? '루틴' : '이벤트'}이(가) 없습니다.`}
          </p>
        </div>
      )}
    </div>
  );
}
