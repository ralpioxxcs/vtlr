"use client";

import ScheduleCard from "@/components/schedule-card";
import { getScheduleList } from "@/pages/api/schedule";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await getScheduleList();

        const scheduleList = response;

        if (!scheduleList) {
          throw new Error("failed to fetch data");
        }
        setData(scheduleList);
      } catch (error: unknown) {
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
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-4">All schedule</h1>
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
              <p>스케줄이 없습니다</p>
            </div>
          </div>
        )}
      </div>
  );
}
