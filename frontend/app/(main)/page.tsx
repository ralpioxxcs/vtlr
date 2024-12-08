import ScheduleCard from "@/components/schedule-card";
import { deleteSchedule, getScheduleList } from "@/pages/api/schedule";

export const metadata = {
  title: "Home",
};

const handleDeleteSchedule = async (id: string) => {
  try {
    const response = await deleteSchedule(id);

    if (!response.ok) {
      throw new Error("Failed to delete card");
    }
  } catch (error) {
    console.error("Error deleting card:", error);
  }
};

export default async function Home() {
  const scheduleList = await getScheduleList();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">모든 스케줄 목록</h1>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}
      >
        {scheduleList.map((schedule: any) => (
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
  );
}
