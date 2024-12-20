"use client";

import { useState } from "react";
import Modal from "./popup";
import { createSchedule, getScheduleList } from "@/pages/api/schedule";

interface IButtonProps {
  title: string;
  scheduleType: string;
  setData: any;
}

function datetimeToCron(datetime: string) {
  console.log(`datetime: ${datetime}`);

  const [datePart, timePart] = datetime.split("T");
  const [_, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  const cronExpression = `${minute} ${hour} ${day} ${month} *`;

  return cronExpression;
}

function generateCronExpression(daysOfWeek: any, minute: string, hour: string) {
  const selectedDays = Object.entries(daysOfWeek)
    .filter(([_, value]) => value)
    .map(([key]) => {
      switch (key) {
        case "mon":
          return "1";
        case "tue":
          return "2";
        case "wed":
          return "3";
        case "thu":
          return "4";
        case "fri":
          return "5";
        default:
          return "";
      }
    })
    .join(",");

  return `${minute} ${hour} * * ${selectedDays}`;
}

export default function CreateButton({
  title,
  scheduleType,
  setData,
}: IButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (
    title: string,
    content: string,
    command: string,
    datetime?: string,
    daysOfWeek?: any,
    minute?: any,
    hour?: any,
  ) => {
    try {
      let cronExp = "";
      if (scheduleType === "one_time") {
        cronExp = datetimeToCron(datetime as string);
      } else if (scheduleType === "recurring") {
        cronExp = generateCronExpression(daysOfWeek, minute, hour);
      }

      await createSchedule(
        scheduleType,
        scheduleType === "recurring" ? "routine" : "event",
        title,
        content,
        command,
        cronExp,
      );

      const response = await getScheduleList(
        scheduleType,
        scheduleType === "recurring" ? "routine" : "event",
      );
      setData(response);
    } catch (error) {
      console.error("Failed to create schedule:", error);
    } finally {
    }
  };

  return (
    <div className="p-4">
      <button
        onClick={openModal}
        className="fixed bottom-4 right-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-2xl shadow-lg transition-all duration-200"
      >
        {title}
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        type={scheduleType}
      >
        이벤트 생성하기
      </Modal>
    </div>
  );
}
