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
  Tab,
  Tabs,
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

const getCurrentTime = () => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

interface ITodayScheduleModalProps {
  onClose: () => void;
  schedule?: any;
  initialTime?: string; // New prop
}

export default function TodayScheduleModal({
  onClose,
  schedule,
  initialTime, // Destructure new prop
}: ITodayScheduleModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!schedule;

  const [title, setTitle] = useState("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [actionType, setActionType] = useState<ActionType>("TTS");
  const [ttsText, setTtsText] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [duration, setDuration] = useState(60);
  const [executionTime, setExecutionTime] = useState(initialTime || getCurrentTime()); // Use initialTime

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
      if (sc?.datetime) {
        setExecutionTime(sc.datetime.split('T')[1].substring(0, 5));
      }
    } else if (initialTime) { // Update executionTime if initialTime changes in non-edit mode
      setExecutionTime(initialTime);
    }
  }, [isEditMode, schedule, initialTime]);

  const { data: devices, isLoading: isLoadingDevices } = useQuery<any>({
    queryKey: ["devices"],
    queryFn: getDevice,
  });

  useEffect(() => {
    if (!isEditMode && devices?.data?.length > 0 && !selectedDevice) {
      setSelectedDevice(devices.data[0].deviceId);
    }
  }, [devices, isEditMode, selectedDevice]);

  const { mutate: createMutate } = useMutation({
    mutationFn: createSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaySchedules'] });
    },
  });

  const { mutate: updateMutate } = useMutation({
    mutationFn: (updatedSchedule: any) =>
      updateSchedule(schedule.id, updatedSchedule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaySchedules'] });
    },
  });

  const { mutate: deleteMutate } = useMutation({
    mutationFn: () => deleteSchedule(schedule.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todaySchedules'] });
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

    const today = new Date().toISOString().split('T')[0];
    const schedulePayload = {
      title: finalTitle,
      schedule_config: {
        type: "ONE_TIME",
        datetime: `${today}T${executionTime}:00`,
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
          {isEditMode ? "스케줄 수정" : "오늘의 스케줄 추가"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <Input
              label="실행 시간"
              type="time"
              value={executionTime}
              onChange={(e) => setExecutionTime(e.target.value)}
              className="text-base"
            />

            <Input
              label="스케줄 이름 (선택)"
              placeholder="예: 점심 약속 알림"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
            />

            <div>
              <h3 className="text-sm font-medium mb-2 text-gray-600">
                어디서 실행할까요?
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
              <h3 className="text-sm font-medium mb-2 text-gray-600">
                무엇을 할까요?
              </h3>
              <Tabs
                fullWidth
                selectedKey={actionType}
                onSelectionChange={(key) => setActionType(key as ActionType)}
              >
                <Tab key="TTS" title="텍스트 읽기" />
                <Tab key="YOUTUBE" title="유튜브 재생" />
              </Tabs>
              {actionType === "TTS" && (
                <Input
                  label="읽어줄 텍스트"
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  className="mt-4 text-base"
                />
              )}
              {actionType === "YOUTUBE" && (
                <div className="mt-4 space-y-4">
                  <Input
                    label="유튜브 URL"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    className="text-base"
                  />
                  <Input
                    type="number"
                    label="재생 시간 (초)"
                    value={String(duration)}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="text-base"
                  />
                </div>
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