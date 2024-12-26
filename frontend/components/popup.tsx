"use client";

import { createSchedule } from "@/pages/api/schedule";
import { getLocalTimeZone, now } from "@internationalized/date";
import { DatePicker } from "@nextui-org/date-picker";
import {
  Button,
  Checkbox,
  CheckboxGroup,
  Form,
  Input,
  TimeInput,
} from "@nextui-org/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ScheduleList } from "Type";
import type { ReactNode } from "react";
import React, { useState } from "react";

interface ModalProps {
  onClose: () => void;
  queryId: string;
  type: ScheduleList["type"];
  children: ReactNode;
}

const datetimeToCron = (datetime: string) => {
  const [datePart, timePart] = datetime.split("T");
  const [_, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  return `${minute} ${hour} ${day} ${month} *`;
};

const generateCronExpression = (daysOfWeek: string[], datetime: string) => {
  const selectedDays = daysOfWeek
    .map((key) => {
      switch (key) {
        case "sun":
          return "0";
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
        case "sat":
          return "6";
        default:
          return "*";
      }
    })
    .join(",");

  const hour = datetime.split(":")[0];
  const minute = datetime.split(":")[1];

  return `${minute} ${hour} * * ${selectedDays}`;
};

//--------------------------------------------------------------------------------

export default function Modal({
  onClose,
  queryId,
  type,
  children,
}: ModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const queryClient = useQueryClient();
  const { mutate: handleCreate } = useMutation({
    mutationFn: ({
      title,
      command,
      cronExp,
    }: {
      title: string;
      command: string;
      cronExp: string;
    }) =>
      createSchedule(
        type,
        type === "recurring" ? "routine" : "event",
        title,
        command,
        cronExp,
      ),
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete schedule:", error),
    onSettled: () => {
      setIsLoading(false);
      onClose();
    },
  });

  const handleForward = async (
    title: string,
    command: string,
    datetime: string,
    daysOfWeek?: string[],
  ) => {
    try {
      let cronExp = "";
      if (type === "one_time") {
        cronExp = datetimeToCron(datetime);
      } else if (daysOfWeek && type === "recurring") {
        cronExp = generateCronExpression(daysOfWeek, datetime);
      }
      handleCreate({ title, command, cronExp });
    } catch (error) {
      console.error("Failed to create schedule:", error);
    }
  };

  const onSubmit = async (e: any) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const data = Object.fromEntries(formData);
    const selectedDays = formData.getAll("days") as string[];

    const newErrors = {};
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    handleForward(
      data.title.toString(),
      data.command.toString(),
      data.datetime.toString(),
      selectedDays,
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-lg shadow-xl min-w-[350px] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h4 className="text-2xl font-bold mb-4">{children}</h4>

        <Form
          className="justify-center items-center"
          validationBehavior="native"
          onSubmit={onSubmit}
        >
          <div className="flex flex-col gap-4 w-full">
            <Input
              isRequired
              label="제목"
              labelPlacement="outside"
              name="title"
              placeholder="이벤트 제목을 입력하세요"
              type="text"
            />

            <Input
              isRequired
              label="명령어"
              labelPlacement="outside"
              name="command"
              placeholder="버틀러가 말할 문장을 입력하세요 🗣️"
              type="text"
              validate={(value) => {
                if (value.length == 1) {
                  return "명령어는 1 글자 이상 작성하세요";
                }
              }}
            />

            {type === "one_time" && (
              <div>
                <DatePicker
                  isRequired
                  label="시작 시간"
                  labelPlacement="outside"
                  name="datetime"
                  defaultValue={now(getLocalTimeZone())}
                  hideTimeZone
                  showMonthAndYearPickers
                  variant="flat"
                  validate={(value) => {
                    if (value < now(getLocalTimeZone())) {
                      return "과거시간은 사용할 수 없습니다";
                    }
                  }}
                />
              </div>
            )}

            {type === "recurring" && (
              <div className="flex flex-col gap-4">
                <TimeInput
                  isRequired
                  label="시작 시간"
                  labelPlacement="outside"
                  name="datetime"
                  defaultValue={now(getLocalTimeZone())}
                  hideTimeZone
                  variant="flat"
                />
                <CheckboxGroup
                  isRequired
                  label="요일"
                  classNames={{
                    label: "text-small text-foreground",
                  }}
                  name="days"
                  orientation="horizontal"
                  radius="full"
                  validate={(value) => {
                    if (value.length < 1) {
                      return "1개 이상의 요일을 선택하세요";
                    }
                  }}
                >
                  <Checkbox value="mon">월</Checkbox>
                  <Checkbox value="tue">화</Checkbox>
                  <Checkbox value="wed">수</Checkbox>
                  <Checkbox value="thu">목</Checkbox>
                  <Checkbox value="fri">금</Checkbox>
                  <Checkbox value="sat">토</Checkbox>
                  <Checkbox value="sun">일</Checkbox>
                </CheckboxGroup>
              </div>
            )}

            <div className="flex gap-4 mt-2">
              <Button
                isLoading={isLoading}
                className="w-full"
                color="primary"
                type="submit"
              >
                {isLoading ? "생성중.." : "만들기"}
              </Button>
              <Button type="reset" variant="bordered">
                초기화
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
