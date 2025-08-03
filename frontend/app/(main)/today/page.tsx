"use client";

import { useState } from "react";
import TodayTimeline from "@/components/TodayTimeline";
import TodayScheduleModal from "@/components/TodayScheduleModal";
import { useQuery } from "@tanstack/react-query";
import { getSchedulesForToday } from "@/pages/api/schedule";

export default function TodaySchedulePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>(
    undefined,
  ); // New state for selected time

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ["todaySchedules"],
    queryFn: getSchedulesForToday,
  });

  const handleTimeClick = (hour: number) => {
    const formattedHour = String(hour).padStart(2, "0");
    setSelectedTime(`${formattedHour}:00`); // Set the selected hour, minutes to 00
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTime(undefined); // Reset selected time when modal closes
  };

  return (
    <div className="relative h-full py-2">
      <h1 className="text-2xl font-bold mb-4">Today's Schedule</h1>

      <TodayTimeline
        schedules={schedules}
        isLoading={isLoading}
        onTimeClick={handleTimeClick}
      />

      {isModalOpen && (
        <TodayScheduleModal
          onClose={handleCloseModal}
          initialTime={selectedTime}
        />
      )}
    </div>
  );
}
