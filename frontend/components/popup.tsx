"use client";

import { createSchedule, updateSchedule } from "@/pages/api/schedule";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Form,
  Input,
  Textarea,
  Divider,
} from "@heroui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScheduleList } from "Type";
import type { ReactNode } from "react";
import React, { useState } from "react";

interface ModalProps {
  onClose: () => void;
  queryId: string;
  type: ScheduleList["type"];
  children: ReactNode;
  schedule?: {
    id: string;
    title: string;
    command: string;
    interval: string;
  };
}

// Cron 표현식에서 시간(HH:MM) 추출
const cronToTime = (cron: string) => {
  if (!cron) return "09:00";
  const parts = cron.split(" ");
  const minute = parts[0];
  const hour = parts[1];
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
};

// Cron 표현식에서 요일 배열 추출
const cronToDays = (cron: string) => {
  if (!cron) return [];
  const dayOfWeek = cron.split(" ")[4];
  if (dayOfWeek === "*") return [];
  return dayOfWeek.split(",").map((d) => {
    switch (d) {
      case "0": return "sun";
      case "1": return "mon";
      case "2": return "tue";
      case "3": return "wed";
      case "4": return "thu";
      case "5": return "fri";
      case "6": return "sat";
      default: return "";
    }
  });
};

// Cron 표현식에서 datetime-local 형식으로 변환
const cronToDateTimeLocal = (cron: string) => {
    if (!cron) {
        const d = new Date();
        d.setMinutes(d.getMinutes() + 1);
        return d.toISOString().slice(0, 16);
    }
    const [minute, hour, day, month] = cron.split(' ');
    const now = new Date();
    const year = now.getFullYear();
    // JavaScript의 month는 0-11 범위이므로 1을 빼줍니다.
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};


export default function Modal({
  onClose,
  queryId,
  type,
  children,
  schedule,
}: ModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (variables: {
      title: string;
      command: string;
      cronExp: string;
    }) => {
      const { title, command, cronExp } = variables;
      const category = type === "recurring" ? "routine" : "event";
      const removeOnComplete = type !== "recurring";

      if (schedule?.id) {
        return updateSchedule(schedule.id, { title, command, interval: cronExp });
      } else {
        return createSchedule(type, category, title, command, cronExp, removeOnComplete);
      }
    },
    onMutate: () => setIsLoading(true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Schedule operation failed:", error),
    onSettled: () => {
      setIsLoading(false);
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    let title = data.title.toString().trim();
    const command = data.command.toString().trim();
    
    if (!title && command) {
      title = command.split('\n')[0]; // Use the first line of the command as title
    }

    if (!command) {
        alert("명령어를 입력해주세요.");
        return;
    }

    let cronExp = "";
    if (type === "one_time") {
      const dt = new Date(data.datetime.toString());
      cronExp = `${dt.getMinutes()} ${dt.getHours()} ${dt.getDate()} ${dt.getMonth() + 1} *`;
    } else {
      const time = data.time.toString();
      const [hour, minute] = time.split(":");
      const days = formData.getAll("days") as string[];
      if (days.length === 0) {
          alert("요일을 하나 이상 선택해주세요.");
          return;
      }
      const dayOfWeek = days.join(",");
      cronExp = `${minute} ${hour} * * ${dayOfWeek}`;
    }

    mutation.mutate({ title, command, cronExp });
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-2xl font-bold mb-4">{children}</h4>

        <Form
          className="flex flex-col gap-4"
          validationBehavior="native"
          onSubmit={handleSubmit}
        >
          <Input
            label="제목 (비워두면 명령어로 자동 생성)"
            name="title"
            placeholder="예: 아침 뉴스 브리핑"
            defaultValue={schedule?.title}
          />
          <Textarea
            isRequired
            label="명령어"
            name="command"
            placeholder="버틀러가 말할 문장을 입력하세요. 🗣️"
            defaultValue={schedule?.command}
            minRows={3}
          />

          <Divider className="my-2" />

          {type === "one_time" && (
            <Input
              isRequired
              type="datetime-local"
              label="실행 날짜 및 시간"
              name="datetime"
              defaultValue={schedule ? cronToDateTimeLocal(schedule.interval) : new Date(Date.now() + 60000).toISOString().slice(0, 16)}
            />
          )}

          {type === "recurring" && (
            <div className="flex flex-col gap-4">
              <Input
                isRequired
                type="time"
                label="실행 시간"
                name="time"
                defaultValue={schedule ? cronToTime(schedule.interval) : "09:00"}
              />
              <CheckboxGroup
                isRequired
                label="요일 선택"
                name="days"
                orientation="horizontal"
                defaultValue={schedule ? cronToDays(schedule.interval) : ["mon", "tue", "wed", "thu", "fri"]}
              >
                <Checkbox value="sun">일</Checkbox>
                <Checkbox value="mon">월</Checkbox>
                <Checkbox value="tue">화</Checkbox>
                <Checkbox value="wed">수</Checkbox>
                <Checkbox value="thu">목</Checkbox>
                <Checkbox value="fri">금</Checkbox>
                <Checkbox value="sat">토</Checkbox>
              </CheckboxGroup>
            </div>
          )}

          <div className="flex gap-4 mt-4">
            <Button
              isLoading={isLoading}
              className="w-full"
              color="primary"
              type="submit"
            >
              {isLoading ? (schedule ? "수정 중..." : "생성 중...") : (schedule ? "수정하기" : "만들기")}
            </Button>
            <Button type="button" variant="bordered" onClick={onClose}>
              취소
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
