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
  Popover,
  MenuItem,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Schedule } from "Type";
import { initialSchedules } from "@/public/data/task";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSchedule,
  deleteTask,
  getScheduleList,
  updateTask,
} from "@/pages/api/schedule";
import {
  DatePicker,
  Form,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@nextui-org/react";
import dayjs from "dayjs";
import { getLocalTimeZone, now } from "@internationalized/date";

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
      startDateTime: string;
      endDateTime: string;
    }) => createSchedule("recurring", "task", title, "", "0 * * * *"),
    onMutate: () => {},
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to create a schedule:", error),
    onSettled: () => {
      //setIsLoading(false);
      closeModal();
    },
  });

  const { mutate: handleTaskCheck } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateTask(id, {
        status: status === "pending" ? "completed" : "pending",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to update task:", error),
  });

  const { mutate: handleTaskDelete } = useMutation({
    mutationFn: ({ id }: { id: string }) => deleteTask(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete task:", error),
  });

  const { mutate: handleTaskEdit } = useMutation({
    mutationFn: ({ id, taskData }: { id: string; taskData: any }) =>
      updateTask(id, taskData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryId] }),
    onError: (error) => console.error("Failed to delete task:", error),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(dayjs());
  const [endDate, setEndDate] = useState(dayjs().add(1, "hour"));
  const [subTasks, setSubTasks] = useState(["", "", ""]);

  const onSubmit = async (e: any) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    console.log({ title, description, startDate, endDate, subTasks });

    handleCreateSchedule({
      title: "title",
      description: "description",
      startDateTime: "",
      endDateTime: "",
    });

    //closeModal();
  };

  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTask, setMenuTask] = useState<Schedule | null>(null);

  const handleToggleExpand = (taskId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleOpenMenu = (
    event: React.MouseEvent<HTMLElement>,
    task: Schedule,
  ) => {
    event.stopPropagation();
    setMenuAnchor(event.currentTarget);
    setMenuTask(task);
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
                <IconButton onClick={(e) => handleOpenMenu(e, schedule)}>
                  <MoreVertIcon />
                </IconButton>
              </div>

              <Collapse in={expanded[schedule.id]} timeout="auto" unmountOnExit>
                <List>
                  {schedule.tasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-2">
                      <Checkbox
                        checked={task.status === "completed"}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() =>
                          handleTaskCheck({ id: task.id, status: task.status })
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
                </List>
              </Collapse>
            </Box>
          ))}
        </div>
      ) : (
        <div className="flex-col items-center text-center grow content-center self-center bg-gray-100 text-gray-800">
          <div className="text-2xl text-gray-600">
            <p>할 일이 없습니다. 새로운 일을 생성하세요</p>
          </div>
        </div>
      )}

      <Popover
        open={Boolean(menuAnchor)}
        anchorEl={menuAnchor}
        //onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => handleTaskEdit({ id: "", taskData: {} })}>
          수정
        </MenuItem>
        <MenuItem onClick={() => handleTaskDelete({ id: "" })}>삭제</MenuItem>
      </Popover>

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
                required
                fullWidth
                label="제목"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                fullWidth
                label="설명"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <DatePicker
                label="시작 날짜 및 시간"
                labelPlacement="outside"
                name="datetime"
                hourCycle={24}
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
              <DatePicker
                label="종료 날짜 및 시간"
                labelPlacement="outside"
                name="datetime"
                hourCycle={24}
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
            </ModalBody>
            <ModalFooter>
              <Button type="reset">취소</Button>
              <Button type="submit">저장</Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </div>
  );
}
