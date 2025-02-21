"use client";

import { useState } from "react";
import {
  Checkbox,
  Typography,
  IconButton,
  Collapse,
  Box,
  List,
  ListItemText,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import { Edit } from "@mui/icons-material";

import { Schedule } from "Type";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AddTask,
  createSchedule,
  deleteSchedule,
  deleteTask,
  getScheduleList,
  updateSchedule,
  updateTask,
} from "@/pages/api/schedule";
import {
  DatePicker,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  SelectItem,
  Select,
  Accordion,
  AccordionItem,
} from "@nextui-org/react";
import dayjs from "dayjs";
import { getLocalTimeZone, now } from "@internationalized/date";

export const alramCycles = [
  { key: "1min", label: "1분마다 알림" },
  { key: "30min", label: "30분마다 알림" },
  { key: "1hour", label: "1시간마다 알림" },
  { key: "2hour", label: "2시간마다 알림" },
];

export default function Home() {
  const queryId = "task";
  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: () => getScheduleList("recurring", "task"),
  });

  const queryClient = useQueryClient();

  const { mutate: handleCreateSchedule } = useMutation({
    mutationFn: ({
      title,
      description,
      startDateTime,
      endDateTime,
    }: {
      title: string;
      description: string;
      startDateTime?: string;
      endDateTime?: string;
    }) => createSchedule("recurring", "task", title, description, "0 * * * *"),
    onMutate: () => {},
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to create a schedule:", error),
    onSettled: () => {
      //setIsLoading(false);
      closeModal();
    },
  });

  const { mutate: handleDeleteSchedule } = useMutation({
    mutationFn: ({ id }: { id: string }) => {
      return deleteSchedule(id);
    },
    onMutate: () => {},
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete the schedule:", error),
    onSettled: () => {
      //setIsLoading(false);
      closeModal();
    },
  });

  const { mutate: handleEditSchedule } = useMutation({
    mutationFn: ({ id }: { id: string }) => {
      return updateSchedule(id, {});
    },
    onMutate: () => {},
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to update the schedule:", error),
    onSettled: () => {
      //setIsLoading(false);
      closeModal();
    },
  });

  const { mutate: handleCheckTask } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTask(id, {
        status: status === "pending" ? "completed" : "pending",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to update task:", error),
  });

  const { mutate: handleAddTask } = useMutation({
    mutationFn: ({ id }: { id: string }) => AddTask(id, { title: newSubTask }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryId] });
      setNewSubTask("");
      setIsAdding(false);
    },
    onError: (error) => console.error("Failed to delete task:", error),
  });

  const { mutate: handleDeleteTask } = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete task:", error),
  });

  const { mutate: handleEditTask } = useMutation({
    mutationFn: ({ id, taskData }: { id: string; taskData: any }) =>
      updateTask(id, taskData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete task:", error),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [openPopover, setOpenPopover] = useState(null);

  const togglePopover = (id) => {
    setOpenPopover(openPopover === id ? null : id);
  };

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(1, "hour"));
  const [subTasks, setSubTasks] = useState(["", "", ""]);

  const onSubmit = async (e: any) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    console.log(data);

    console.log({ title, description, startDate, endDate, subTasks });

    handleCreateSchedule({
      title: data.title as string,
      description: (data.description as string) || "description",
      startDateTime: data.startDateTime || null,
      endDateTime: "",
    });

    //closeModal();
  };

  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTask, setMenuTask] = useState<Schedule | null>(null);

  const [newSubTask, setNewSubTask] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [holdTimeout, setHoldTimeout] = useState<NodeJS.Timeout | null>(null);
  const startHold = (taskId: string) => {
    const timeout = setTimeout(() => handleDeleteTask({ id: taskId }), 1000);
    setHoldTimeout(timeout);
  };

  const cancelHold = () => {
    if (holdTimeout) {
      clearTimeout(holdTimeout);
    }
  };

  const handleToggleExpand = (taskId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  if (isLoading) {
    return (
      <div className="grow flex justify-center items-center">
        <Spinner size="lg" label="로딩 중.." />
      </div>
    );
  }

  if (isError) {
    return <h1>Error</h1>;
  }

  return (
    <div className="w-full max-w-md mt-4 p-4 bg-gray-100">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h5">할일 목록</Typography>
        <IconButton onClick={openModal}>
          <AddIcon />
        </IconButton>
      </div>

      {data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((schedule) => (
            <Box
              key={schedule.id}
              className="p-4 bg-white shadow-md rounded-xl cursor-pointer"
              onClick={() => handleToggleExpand(schedule.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-col items-center space-y-1">
                  <Typography className="text-lg font-normal overflow-hidden whitespace-nowrap text-ellipsis w-40">
                    {schedule.title}
                  </Typography>
                  {schedule.startTime && (
                    <Typography className="text-xs text-gray-400">
                      시작일:{new Date(schedule.startTime).toLocaleString()}
                    </Typography>
                  )}
                  {schedule.endTime && (
                    <Typography className="text-xs text-gray-400">
                      종료일: {new Date(schedule.endTime).toLocaleString()}
                    </Typography>
                  )}
                </div>

                <Popover
                  isOpen={openPopover === schedule.id}
                  onOpenChange={() => togglePopover(schedule.id)}
                  placement="bottom-end"
                >
                  <PopoverTrigger>
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onPress={() => togglePopover(schedule.id)}
                    >
                      <MoreVertIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-2 bg-white shadow-md rounded-md">
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="light"
                        size="sm"
                        startContent={<Edit size={16} />}
                        onPress={() => handleEditSchedule({ id: schedule.id })}
                      >
                        스케줄 수정
                      </Button>
                      <Button
                        variant="light"
                        size="sm"
                        startContent={<DeleteIcon size={16} />}
                        onPress={() =>
                          handleDeleteSchedule({ id: schedule.id })
                        }
                      >
                        스케줄 삭제
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <Collapse in={expanded[schedule.id]} timeout="auto" unmountOnExit>
                <List>
                  {schedule.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center space-x-2"
                      onTouchStart={() => startHold(task.id)}
                      onTouchEnd={cancelHold}
                      onMouseDown={() => startHold(task.id)}
                      onMouseUp={cancelHold}
                      onMouseLeave={cancelHold}
                    >
                      <Checkbox
                        checked={task.status === "completed"}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() =>
                          handleCheckTask({ id: task.id, status: task.status })
                        }
                      />
                      <ListItemText
                        className="text-sm text-gray-500"
                        primary={
                          <Typography
                            sx={{ fontSize: "0.9rem", color: "gray" }}
                          >
                            {task.title}
                          </Typography>
                        }
                      />
                    </div>
                  ))}

                  {isAdding && (
                    <Input
                      autoFocus
                      value={newSubTask}
                      onChange={(e) => setNewSubTask(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddTask({ id: schedule.id })
                      }
                      placeholder="할일 제목 입력.."
                    />
                  )}

                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => setIsAdding(true)}
                  >
                    <AddIcon />
                  </Button>
                </List>
              </Collapse>
            </Box>
          ))}
        </div>
      ) : (
        <div className="flex-col items-center text-center grow content-center self-center bg-gray-100 text-gray-800">
          <div className="text-2xl text-gray-600">
            <p>새로운 일을 생성하세요!</p>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onOpenChange={closeModal}
        placement="center"
        size="sm"
      >
        <ModalContent>
          <form onSubmit={onSubmit}>
            <ModalHeader>할 일 추가</ModalHeader>
            <ModalBody>
              <Input
                isRequired
                required
                label="제목"
                labelPlacement="outside"
                name="title"
                placeholder="스케줄 제목을 입력하세요"
                type="text"
              />
              <Select
                isRequired
                className="max-w-xs"
                labelPlacement="outside"
                label="알람 시간"
                defaultSelectedKeys={["1hour"]}
                placeholder="시간을 선택하세요"
              >
                {alramCycles.map((animal) => (
                  <SelectItem key={animal.key}>{animal.label}</SelectItem>
                ))}
              </Select>

              <Accordion isCompact variant="light">
                <AccordionItem
                  key="1"
                  aria-label="Accordion 1"
                  title="추가 설정"
                >
                  <Input
                    label="설명"
                    labelPlacement="outside"
                    name="description"
                    placeholder="스케줄 설명을 입력하세요"
                    type="text"
                  />
                  <DatePicker
                    label="시작 날짜 및 시간"
                    name="datetime"
                    hourCycle={24}
                    hideTimeZone
                    showMonthAndYearPickers
                    variant="flat"
                    defaultValue={now(getLocalTimeZone())}
                    validate={(value) => {
                      if (value < now(getLocalTimeZone())) {
                        return "과거시간은 사용할 수 없습니다";
                      }
                    }}
                  />
                  <DatePicker
                    label="종료 날짜 및 시간"
                    name="datetime"
                    hourCycle={24}
                    hideTimeZone
                    showMonthAndYearPickers
                    variant="flat"
                    defaultValue={now(getLocalTimeZone())}
                    validate={(value) => {
                      if (value < now(getLocalTimeZone())) {
                        return "과거시간은 사용할 수 없습니다";
                      }
                    }}
                  />
                </AccordionItem>
              </Accordion>
            </ModalBody>
            <ModalFooter>
              <Button className="w-full" color="primary" type="submit">
                {isLoading ? "생성중.." : "만들기"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
