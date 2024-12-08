import CreateButton from "@/components/create-schedule";
import ScheduleCard from "@/components/schedule-card";

import { getScheduleList } from "@/pages/api/schedule";

export const metadata = {
  title: "Routine",
};

export default async function Home() {
  const schedules = await getScheduleList();
  const routineList = schedules.filter((item: any) => {
    return item.type === "recurring";
  });

  return (
    <div>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">내 루틴</h1>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {routineList.map((schedule: any) => (
            <ScheduleCard
              key={schedule.rowId}
              id={schedule.rowId}
              title={schedule.title}
              description={schedule.description}
              type={schedule.type}
              interval={schedule.interval}
              active={schedule.active}
            />
          ))}
        </div>
      </div>
      <div>
        <CreateButton scheduleTitle="새로운 루틴" scheduleType="recurring" />
      </div>
    </div>
  );
}
