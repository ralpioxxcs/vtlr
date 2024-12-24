"use client";

import { createSchedule } from "@/pages/api/schedule";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScheduleList } from "Type";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";

interface ModalProps {
  onClose: () => void;
  queryId: string;
  // onSubmit: (
  //   title: string,
  //   content: string,
  //   command: string,
  //   datetime?: string,
  //   daysOfWeek?: any,
  //   minute?: any,
  //   hour?: any,
  // ) => void;
  type: ScheduleList["type"];
  children: ReactNode;
}

const datetimeToCron = (datetime: string) => {
  console.log(`datetime: ${datetime}`);

  const [datePart, timePart] = datetime.split("T");
  const [_, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  const cronExpression = `${minute} ${hour} ${day} ${month} *`;

  return cronExpression;
};

const generateCronExpression = (
  daysOfWeek: any,
  minute: string,
  hour: string,
) => {
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
};

export default function Modal({
  onClose,
  queryId,
  // onSubmit,
  type,
  children,
}: ModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [daysOfWeek, setDaysOfWeek] = useState({
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
  });

  const [hour, setHour] = useState("00");
  const [minute, setMinute] = useState("00");

  const handleDayChange = (day: string) => {
    setDaysOfWeek((prev: any) => ({
      ...prev,
      [day]: !prev[day],
    }));
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.name === "hour") {
      setHour(e.target.value);
    } else if (e.target.name === "minute") {
      setMinute(e.target.value);
    }
  };

  const queryClient = useQueryClient();
  const { mutate: handleCreate } = useMutation({
    mutationFn: ({
      title,
      content,
      command,
      cronExp,
    }: {
      title: string;
      content: string;
      command: string;
      cronExp: string;
    }) =>
      createSchedule(
        type,
        type === "recurring" ? "routine" : "event",
        title,
        content,
        command,
        cronExp,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete schedule:", error),
  });

  const handleForward = async (
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
      if (type === "one_time") {
        cronExp = datetimeToCron(datetime as string);
      } else if (type === "recurring") {
        cronExp = generateCronExpression(daysOfWeek, minute, hour);
      }

      handleCreate({ title, content, command, cronExp });
    } catch (error) {
      console.error("Failed to create schedule:", error);
    } finally {
    }
  };

  const handleSubmit = async ({
    currentTarget: {
      title: { value: title },
      content: { value: content },
      command: { value: command },
      datetime: { value: datetime },
    },
  }: FormEvent<
    HTMLFormElement &
      Record<"title" | "content" | "command" | "datetime", HTMLInputElement>
  >) => {
    handleForward(title, content, command, datetime, daysOfWeek, minute, hour);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-4">{children}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="title"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              제목
            </label>
            <input
              placeholder="이벤트 제목"
              type="text"
              id="title"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="content"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              내용
            </label>
            <textarea
              placeholder="이벤트 설명"
              id="content"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-32"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="command"
              className="block text-gray-700 text-sm font-bold mb-2"
            >
              명령어
            </label>
            <input
              placeholder="버틀러가 말할 문장 🗣️"
              id="command"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            />
          </div>

          {type === "one_time" && (
            <div className="mb-6">
              <label
                htmlFor="datetime"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                시간
              </label>
              <input
                type="datetime-local"
                id="datetime"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
            </div>
          )}

          {type === "recurring" && (
            <div className="mb-6">
              <div className="mb-2">
                <label
                  htmlFor="datetime"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  요일
                </label>

                <div className="mx-auto space-x-8">
                  {["mon", "tue", "wed", "thu", "fri"].map((day) => (
                    <label key={day} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={daysOfWeek[day]}
                        onChange={() => handleDayChange(day)}
                        className="form-checkbox text-indigo-600"
                      />
                      <span className="ml-2 capitalize">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-2">
                <label
                  htmlFor="datetime"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  시간
                </label>

                <div className="flex space-x-4">
                  <select
                    name="hour"
                    value={hour}
                    onChange={handleTimeChange}
                    className="w-1/2 p-2 border border-gray-300 rounded"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i.toString().padStart(2, "0")}>
                        {i.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>

                  <select
                    name="minute"
                    value={minute}
                    onChange={handleTimeChange}
                    className="w-1/2 p-2 border border-gray-300 rounded"
                  >
                    {Array.from({ length: 60 }, (_, i) => (
                      <option key={i} value={i.toString().padStart(2, "0")}>
                        {i.toString().padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
              disabled={isSubmitting}
            >
              {isSubmitting ? "만드는 중..." : "만들기"}
            </button>
            <button
              type="reset"
              onClick={onClose}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline"
              disabled={isSubmitting}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
