"use client";

import { getScheduleList } from "@/pages/api/schedule";
import { useEffect, useState } from "react";
import ScheduleCard from "./schedule-card";
import CreateButton from "./create-schedule";

export type ScheduleCardListProps = {
  title?: string;
  type?: string;
};

export default function ScheduleCardList({
  title,
  type,
}: ScheduleCardListProps) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const response = await getScheduleList();

        let scheduleList = [];

        if (type) {
          scheduleList = response.filter((item: any) => {
            return item.type === type;
          });
        } else {
          scheduleList = response;
        }

        if (!scheduleList) {
          throw new Error("failed to fetch data");
        }
        setData(scheduleList);
      } catch (error: unknown) {
        setError(error.message);
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
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {data?.map((schedule: any) => (
            <ScheduleCard
              key={schedule.id}
              id={schedule.id}
              title={schedule.title}
              description={schedule.description}
              type={schedule.type}
              interval={schedule.interval}
              active={schedule.active}
              data={setData}
            />
          ))}
        </div>
      </div>
      <div>
        {type && (
          <CreateButton
            scheduleTitle={title}
            scheduleType={type}
            data={setData}
          />
        )}
      </div>
    </div>
  );
}
