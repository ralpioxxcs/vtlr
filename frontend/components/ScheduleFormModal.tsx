"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  PressEvent,
  Select,
  SelectItem,
  Spinner,
} from "@heroui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "@/pages/api/schedule";
import { getDevice } from "@/pages/api/device";
import type { Device } from "Type";
import { TrashIcon } from "@heroicons/react/24/outline";

// Helper functions to get current time in required formats
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

interface IScheduleFormModalProps {
  onClose: () => void;
  schedule?: any;
}

type ActionType = "TTS" | "YOUTUBE";
type ScheduleType = "ONE_TIME" | "RECURRING" | "HOURLY";

export default function ScheduleFormModal({
  onClose,
  schedule,
}: IScheduleFormModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!schedule;

  // Form state with current time as default for new schedules
  const [title, setTitle] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [actionType, setActionType] = useState<ActionType>("TTS");
  const [ttsText, setTtsText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [duration, setDuration] = useState(60);
  const [scheduleType, setScheduleType] = useState<ScheduleType>("ONE_TIME");
  const [oneTimeDate, setOneTimeDate] = useState(getCurrentDateTimeLocal());
  const [recurringDays, setRecurringDays] = useState<string[]>([]);
  const [executionTime, setExecutionTime] = useState(getCurrentTime());

  useEffect(() => {
    if (isEditMode && schedule) {
      setTitle(schedule.title || "");
      const ac = schedule.action_config;
      setSelectedDevice(ac?.deviceId || "");
      setActionType(ac?.type || "TTS");
      setTtsText(ac?.text || "");
      setYoutubeUrl(ac?.url || "");
      setDuration(ac?.duration || 60);
      const sc = schedule.schedule_config;
      setScheduleType(sc?.type || "ONE_TIME");
      setOneTimeDate(sc?.datetime || getCurrentDateTimeLocal());
      setRecurringDays(sc?.days || []);
      setExecutionTime(sc?.time || getCurrentTime());
    }
  }, [isEditMode, schedule]);

  const { data: devices, isLoading: isLoadingDevices } = useQuery<any>({
    queryKey: ["devices"],
    queryFn: getDevice,
  });

  useEffect(() => {
    if (!isEditMode && devices?.data?.length > 0 && !selectedDevice) {
      setSelectedDevice(devices.data[0].deviceId);
    }
  }, [devices, isEditMode, selectedDevice]);

  // Mutations with optimistic updates
  const { mutate: createMutate } = useMutation({
    mutationFn: createSchedule,
    onMutate: async (newSchedule) => {
      const queryKey = ["main"];
      await queryClient.cancelQueries({ queryKey });
      const previousData = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (oldData: any[] | undefined) => {
        const optimisticNewSchedule = {
          ...newSchedule,
          id: `temp-${Date.now()}`,
        };
        return oldData
          ? [optimisticNewSchedule, ...oldData]
          : [optimisticNewSchedule];
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData)
        queryClient.setQueryData(["main"], context.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["main"] });
    },
  });

  const { mutate: updateMutate } = useMutation({
    mutationFn: (updatedSchedule: any) =>
      updateSchedule(schedule.id, updatedSchedule),
    onMutate: async (updatedSchedule) => {
      const queryKeys = [["main"], ["routine"], ["event"]];
      await Promise.all(
        queryKeys.map((key) => queryClient.cancelQueries({ queryKey: key })),
      );
      const previousData = new Map(
        queryKeys.map((key) => [key.toString(), queryClient.getQueryData(key)]),
      );
      queryKeys.forEach((key) => {
        const oldData: any[] | undefined = queryClient.getQueryData(key);
        if (oldData) {
          const newData = oldData.map((item) =>
            item.id === schedule.id ? { ...item, ...updatedSchedule } : item,
          );
          queryClient.setQueryData(key, newData);
        }
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      context?.previousData.forEach((data, key) =>
        queryClient.setQueryData(key.split(","), data),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["main"] });
      queryClient.invalidateQueries({ queryKey: ["routine"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
    },
  });

  const { mutate: deleteMutate } = useMutation({
    mutationFn: () => deleteSchedule(schedule.id),
    onMutate: async () => {
      const queryKeys = [["main"], ["routine"], ["event"]];
      await Promise.all(
        queryKeys.map((key) => queryClient.cancelQueries({ queryKey: key })),
      );
      const previousData = new Map(
        queryKeys.map((key) => [key.toString(), queryClient.getQueryData(key)]),
      );
      queryKeys.forEach((key) => {
        const oldData: any[] | undefined = queryClient.getQueryData(key);
        if (oldData)
          queryClient.setQueryData(
            key,
            oldData.filter((item) => item.id !== schedule.id),
          );
      });
      return { previousData };
    },
    onError: (err, variables, context) => {
      context?.previousData.forEach((data, key) =>
        queryClient.setQueryData(key.split(","), data),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["main"] });
      queryClient.invalidateQueries({ queryKey: ["routine"] });
      queryClient.invalidateQueries({ queryKey: ["event"] });
    },
  });

  const handleDelete = () => {
    if (window.confirm("정말로 이 스케줄을 삭제하시겠습니까?")) {
      deleteMutate();
      onClose();
    }
  };

  const handleSave = () => {
    if (!selectedDevice) {
      alert("장치를 선택해주세요.");
      return;
    }
    let finalTitle = title.trim();
    if (finalTitle === "") {
      finalTitle =
        actionType === "TTS"
          ? ttsText
            ? `TTS: ${ttsText.substring(0, 20)}...`
            : "새로운 TTS 알림"
          : "YouTube 재생";
    }
    const schedulePayload = {
      title: finalTitle,
      schedule_config: {
        type: scheduleType,
        datetime: oneTimeDate,
        days: recurringDays,
        time: executionTime,
      },
      action_config: {
        deviceId: selectedDevice,
        type: actionType,
        text: ttsText,
        url: youtubeUrl,
        duration: duration,
      },
      active: schedule?.active ?? true,
    };
    if (scheduleType === "HOURLY") {
      schedulePayload.action_config.text = `${executionTime.split(":")[0]}시 정각입니다.`;
      schedulePayload.title = `${executionTime.split(":")[0]}시 정각 알림`;
    }

    if (isEditMode) {
      updateMutate(schedulePayload);
    } else {
      createMutate(schedulePayload);
    }
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} placement="center" scrollBehavior="outside">
      <ModalContent
        onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
      >
        <ModalHeader className="flex flex-col gap-1">
          {isEditMode ? "스케줄 수정" : "새 스케줄 생성"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <Input
              label="스케줄 이름"
              placeholder="예: 퇴근 시간 알림"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
            />

            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-600">
                1. 어디서 실행할까요?
              </h3>
              {isLoadingDevices ? (
                <Spinner />
              ) : (
                <Select
                  label="장치 선택"
                  selectedKeys={[selectedDevice]}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="text-base"
                >
                  {devices?.data.map((device: Device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.name}
                    </SelectItem>
                  ))}
                </Select>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-600">
                2. 무엇을 할까요?
              </h3>
              <Select
                label="액션 선택"
                selectedKeys={[actionType]}
                onChange={(e) => setActionType(e.target.value as ActionType)}
                className="text-base"
              >
                <SelectItem key="TTS" value="TTS">
                  텍스트 읽어주기
                </SelectItem>
                <SelectItem key="YOUTUBE" value="YOUTUBE">
                  유튜브 재생
                </SelectItem>
              </Select>
              {actionType === "TTS" && (
                <Input
                  label="읽어줄 텍스트"
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  className="mt-2 text-base"
                />
              )}
              {actionType === "YOUTUBE" && (
                <>
                  <Input
                    label="유튜브 URL"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="mt-2 text-base"
                  />
                  <Input
                    type="number"
                    label="재생 시간 (초)"
                    value={String(duration)}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="mt-2 text-base"
                  />
                </>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium mb-1 text-gray-600">
                3. 언제 할까요?
              </h3>
              <Select
                label="스케줄 타입"
                selectedKeys={[scheduleType]}
                onChange={(e) =>
                  setScheduleType(e.target.value as ScheduleType)
                }
                className="text-base"
              >
                <SelectItem key="ONE_TIME" value="ONE_TIME">
                  한 번만 실행
                </SelectItem>
                <SelectItem key="RECURRING" value="RECURRING">
                  반복 실행
                </SelectItem>
                <SelectItem key="HOURLY" value="HOURLY">
                  정각마다 실행
                </SelectItem>
              </Select>
              {scheduleType === "ONE_TIME" && (
                <Input
                  type="datetime-local"
                  label="실행 날짜 및 시간"
                  value={oneTimeDate}
                  onChange={(e) => setOneTimeDate(e.target.value)}
                  className="mt-2 text-base"
                />
              )}
              {scheduleType === "RECURRING" && (
                <div className="mt-2 space-y-2">
                  <Input
                    type="time"
                    label="실행 시간"
                    value={executionTime}
                    onChange={(e) => setExecutionTime(e.target.value)}
                    className="text-base"
                  />
                  <div className="flex flex-wrap gap-2">
                    {["월", "화", "수", "목", "금", "토", "일"].map((day) => (
                      <Button
                        key={day}
                        size="sm"
                        variant={
                          recurringDays.includes(day) ? "solid" : "outline"
                        }
                        onPress={() =>
                          setRecurringDays((days) =>
                            days.includes(day)
                              ? days.filter((d) => d !== day)
                              : [...days, day],
                          )
                        }
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {scheduleType === "HOURLY" && (
                <Input
                  type="number"
                  label="실행 시간 (0-23)"
                  value={executionTime.split(":")[0]}
                  onChange={(e) => setExecutionTime(`${e.target.value}:00`)}
                  className="mt-2 text-base"
                  min="0"
                  max="23"
                />
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          {isEditMode && (
            <Button
              color="danger"
              variant="light"
              onPress={handleDelete}
              className="mr-auto"
            >
              <TrashIcon className="w-5 h-5" />
            </Button>
          )}
          <Button
            variant="light"
            onPress={(e: PressEvent) => {
              onClose();
            }}
          >
            취소
          </Button>
          <Button color="primary" onPress={handleSave}>
            {isEditMode ? "업데이트" : "저장"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
