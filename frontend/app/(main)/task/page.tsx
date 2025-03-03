"use client";

import React, { useState, useCallback } from "react";
import {
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
  Checkbox,
  DateRangePicker,
  TimeInput,
} from "@heroui/react";
import { today, parseTime } from "@internationalized/date";

const periods = [
  { key: "30min", label: "30분마다 알림" },
  { key: "1hour", label: "1시간마다 알림" },
  { key: "2hour", label: "2시간마다 알림" },
];

const ScheduleItem = React.memo(
  ({
    schedule,
    expanded,
    handleToggleExpand,
    handleEditSchedule,
    handleDeleteSchedule,
    handleCheckTask,
    handleDeleteTask,
    startHold,
    cancelHold,
    isAdding,
    setIsAdding,
    newSubTask,
    setNewSubTask,
    handleAddTask,
    openPopover,
    togglePopover,
  }) => (
    <Box
      key={schedule.id}
      className="p-4 bg-white shadow-md rounded-md cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <div className="flex-col items-center space-y-1">
          <Typography
            className="text-lg font-normal overflow-hidden whitespace-nowrap text-ellipsis w-60"
            onClick={() => handleToggleExpand(schedule.id)}
          >
            {schedule.title}
          </Typography>
          {schedule.startTime && schedule.endTime && (
            <Typography className="text-xs text-gray-400">
              기간: {new Date(schedule.startTime).toLocaleDateString()} ~{" "}
              {new Date(schedule.endTime).toLocaleDateString()}
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
                startContent={<Edit />}
                onPress={() => handleEditSchedule({ id: schedule.id })}
              >
                스케줄 수정
              </Button>
              <Button
                variant="light"
                size="sm"
                startContent={<DeleteIcon />}
                onPress={() => handleDeleteSchedule({ id: schedule.id })}
              >
                스케줄 삭제
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Collapse in={expanded[schedule.id]} unmountOnExit timeout={50}>
        <List className="flex flex-col gap-1">
          {schedule.tasks.length === 0 && !isAdding ? (
            <div className="text-center text-gray-500">
              아래 버튼을 눌러서 할일을 추가하세요
            </div>
          ) : (
            schedule.tasks.map((task) => (
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
                  lineThrough
                  isSelected={task.status === "completed"}
                  onClick={(e) => e.stopPropagation()}
                  onChange={() =>
                    handleCheckTask({
                      id: task.id,
                      status: task.status,
                    })
                  }
                />
                <ListItemText
                  className="text-sm text-gray-500"
                  primary={
                    <Typography sx={{ fontSize: "0.9rem", color: "gray" }}>
                      {task.title}
                    </Typography>
                  }
                />
              </div>
            ))
          )}

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

          <div className="text-center text-gray-500">
            <Button
              isIconOnly
              variant="light"
              onPress={() => setIsAdding(true)}
            >
              <AddIcon />
            </Button>
          </div>
        </List>
      </Collapse>
    </Box>
  ),
);

const Home = () => {
  const queryId = "task";
  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: () => getScheduleList("recurring", "task"),
  });

  const queryClient = useQueryClient();

  const handleCreateSchedule = useMutation({
    mutationFn: ({
      title,
      description,
      startDateTime,
      endDateTime,
    }: {
      title: string;
      description: string;
      startDateTime: string;
      endDateTime: string;
    }) => {
      let cronExp = "0 * * * *";

      if (selectKey === "30min") {
        cronExp = "*/30 * * * *";
      } else if (selectKey === "1hour") {
        cronExp = "0 * * * *";
      } else if (selectKey === "2hour") {
        cronExp = "0 */2 * * *";
      } else {
        cronExp = "* * * * *";
      }

      return createSchedule(
        "recurring",
        "task",
        title,
        "",
        cronExp,
        false,
        startDateTime,
        endDateTime,
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to create a schedule:", error),
    onSettled: () => {
      closeModal();
    },
  }).mutate;

  const handleDeleteSchedule = useMutation({
    mutationFn: ({ id }) => deleteSchedule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete the schedule:", error),
    onSettled: () => {
      closeModal();
    },
  }).mutate;

  const handleEditSchedule = useMutation({
    mutationFn: ({ id }) => {
      alert("update!");
      //updateSchedule(id, {})
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to update the schedule:", error),
    onSettled: () => {
      closeModal();
    },
  }).mutate;

  const handleCheckTask = useMutation({
    mutationFn: ({ id, status }) =>
      updateTask(id, {
        status: status === "pending" ? "completed" : "pending",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to update task:", error),
  }).mutate;

  const handleAddTask = useMutation({
    mutationFn: ({ id }) => AddTask(id, { title: newSubTask }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryId] });
      setNewSubTask("");
      setIsAdding(false);
    },
    onError: (error) => console.error("Failed to delete task:", error),
  }).mutate;

  const handleDeleteTask = useMutation({
    mutationFn: ({ id }) => deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete task:", error),
  }).mutate;

  const handleEditTask = useMutation({
    mutationFn: ({ id, taskData }) => updateTask(id, taskData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete task:", error),
  }).mutate;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openPopover, setOpenPopover] = useState(null);
  const [selectKey, setValue] = useState("");
  const [expanded, setExpanded] = useState({});
  const [newSubTask, setNewSubTask] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [holdTimeout, setHoldTimeout] = useState(null);

  const [dateRange, setDateRange] = React.useState({
    start: today("Asia/Seoul"),
    end: today("Asia/Seoul").add({ days: 1 }),
  });

  const [schduleTitleValue, setSchduleTitleValue] = useState("");
  const [error, setError] = useState("");

  const handleChangeScheduleTitleValue = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const inputValue = e.target.value;
    setSchduleTitleValue(inputValue);

    if (inputValue.length === 0) {
      setError("최소 1자 이상 입력해야 합니다.");
    } else if (inputValue.length > 20) {
      setError("최대 20자까지 입력할 수 있습니다.");
    } else {
      setError("");
    }
  };

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const togglePopover = useCallback(
    (id) => {
      setOpenPopover(openPopover === id ? null : id);
    },
    [openPopover],
  );

  const startHold = useCallback(
    (taskId) => {
      const timeout = setTimeout(() => handleDeleteTask({ id: taskId }), 1000);
      setHoldTimeout(timeout);
    },
    [handleDeleteTask],
  );

  const cancelHold = useCallback(() => {
    if (holdTimeout) {
      clearTimeout(holdTimeout);
    }
  }, [holdTimeout]);

  const handleToggleExpand = useCallback((taskId) => {
    setExpanded((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  }, []);

  const onSubmit = async (e: any) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    handleCreateSchedule({
      title: data.title as string,
      description: (data.description as string) || "description",
      startDateTime: dateRange.start.toString(),
      endDateTime: dateRange.end.toString(),
    });
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
        <h3 className="text-xl">할일 목록</h3>
        <IconButton onClick={openModal}>
          <AddIcon />
        </IconButton>
      </div>

      {data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((schedule) => (
            <ScheduleItem
              key={schedule.id}
              schedule={schedule}
              expanded={expanded}
              handleToggleExpand={handleToggleExpand}
              handleEditSchedule={handleEditSchedule}
              handleDeleteSchedule={handleDeleteSchedule}
              handleCheckTask={handleCheckTask}
              handleDeleteTask={handleDeleteTask}
              startHold={startHold}
              cancelHold={cancelHold}
              isAdding={isAdding}
              setIsAdding={setIsAdding}
              newSubTask={newSubTask}
              setNewSubTask={setNewSubTask}
              handleAddTask={handleAddTask}
              openPopover={openPopover}
              togglePopover={togglePopover}
            />
          ))}
        </div>
      ) : (
        <div className="flex-col items-center text-center grow content-center self-center bg-gray-100 text-gray-800">
          <div className="text-2xl text-gray-600">
            <p>새로운 일을 생성하세요!</p>
          </div>
        </div>
      )}

      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=false"
      />
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
                value={schduleTitleValue}
                onChange={handleChangeScheduleTitleValue}
                isInvalid={!!error}
                errorMessage={error}
              />
              <Select
                isRequired
                className="max-w-xs"
                labelPlacement="outside"
                label="알람 시간"
                defaultSelectedKeys={["1hour"]}
                onChange={(e) => {
                  setValue(e.target.value);
                }}
                placeholder="시간을 선택하세요"
              >
                {periods.map((period) => (
                  <SelectItem key={period.key}>{period.label}</SelectItem>
                ))}
              </Select>

              <Accordion isCompact>
                <AccordionItem key="1" title="추가 설정">
                  <div className="flex flex-col gap-3">
                    <DateRangePicker
                      size="sm"
                      label="스케줄 설정 기간"
                      labelPlacement="outside"
                      hourCycle={24}
                      hideTimeZone
                      variant="flat"
                      value={dateRange}
                      onChange={setDateRange}
                    />
                    <TimeInput
                      size="sm"
                      label="비활성화 시작 시간"
                      labelPlacement="outside"
                      defaultValue={parseTime("22:00")}
                    />
                    <TimeInput
                      size="sm"
                      label="비활성화 종료 시간"
                      labelPlacement="outside"
                      defaultValue={parseTime("06:00")}
                    />
                  </div>
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
};

export default Home;
