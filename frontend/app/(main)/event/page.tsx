"use client";

import CreateButton from "@/components/create-schedule";
import ScheduleCard from "@/components/schedule-card";
import { getScheduleList } from "@/pages/api/schedule";
import { useEffect, useState } from "react";

export default function EventPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const scheduleList = await getScheduleList("one_time", "event");
        if (!scheduleList) {
          throw new Error("failed to fetch data");
        }
        setData(scheduleList);
      } catch (error) {
        if(error instanceof Error) {
          setError(error.message);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error) {
    return <h1>Error</h1>;
  }

return (
    <div>
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-4">My events</h1>
        {data.length > 0 ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            }}
          >
            {data?.map((schedule: any) => (
              <ScheduleCard
                key={schedule.rowId}
                id={schedule.rowId}
                title={schedule.title}
                description={schedule.description}
                type={schedule.type}
                interval={schedule.interval}
                active={schedule.active}
                setData={setData}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-screen bg-gray-100 text-gray-800">
            <div className="text-2xl text-gray-600">
              <p>이벤트가 없습니다. 새로운 이벤트를 생성하세요</p>
            </div>
          </div>
        )}
      </div>
      <div>
        <CreateButton
          title="New event"
          scheduleType="one_time"
          setData={setData}
        />
      </div>
    </div>
  );
}
