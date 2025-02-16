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
  TextField,
  Button,
  Modal,
} from "@mui/material";
import { MoreVert as MoreVertIcon, Add as AddIcon } from "@mui/icons-material";
import { Schedule, Task } from "Type";
import { initialSchedules } from "@/public/data/task";
import { useQuery } from "@tanstack/react-query";
import { getScheduleList } from "@/pages/api/schedule";
import { Spinner } from "@nextui-org/react";

export default function Home() {
  const queryId = "task";
  const { data, isLoading, isError } = useQuery({
    queryKey: [queryId],
    queryFn: () => getScheduleList("recurring", "task"),
  });

  const [tasks, setSchedule] = useState<Schedule[]>(initialSchedules);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTask, setMenuTask] = useState<Schedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [openModal, setOpenModal] = useState(false);
  const [openScheduleModal, setOpenAddScheduledModal] = useState(false);

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

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuTask(null);
  };

  const handleSubTaskToggle = (scheduleId: string, taskId: string) => {
    setSchedule((prevSchedules: Schedule[]) =>
      prevSchedules.map((schedule: Schedule) =>
        schedule.id === scheduleId
          ? {
              ...schedule,
              tasks: schedule.tasks.map((task: Task) =>
                task.id === taskId
                  ? {
                      ...task,
                      status:
                        task.status === "pending" ? "completed" : "pending",
                    }
                  : task,
              ),
            }
          : schedule,
      ),
    );
  };

  //
  const handleOpenModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedSchedule(null);
  };

  const handleOpenAddScheduleModal = () => {
    setOpenAddScheduledModal(true);
  };

  const handleCloseAddModal = () => {
    setOpenAddScheduledModal(false);
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
        <IconButton onClick={handleOpenAddScheduleModal}>
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
                  <Typography className="text-xs text-gray-400">
                    시작일: {new Date(schedule.startTime).toLocaleString() || "없음"}
                  </Typography>
                  <Typography className="text-xs text-gray-400">
                    종료일: {new Date(schedule.endTime).toLocaleString() || "없음"}
                  </Typography>
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
                          handleSubTaskToggle(schedule.id, task.id)
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
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem onClick={() => handleOpenModal(menuTask!)}>수정</MenuItem>
        <MenuItem onClick={handleCloseMenu}>삭제</MenuItem>
      </Popover>

      <Modal open={openModal} onClose={handleCloseModal}>
        <Box className="p-6 bg-white shadow-lg rounded-lg max-w-md mx-auto mt-20">
          <Typography variant="h6">세부 설정</Typography>
          {selectedSchedule && (
            <>
              <TextField
                label="할일 제목"
                fullWidth
                margin="normal"
                defaultValue={selectedSchedule.title}
              />
              <TextField
                label="마감 기한"
                type="date"
                fullWidth
                margin="normal"
                defaultValue={selectedSchedule.endDate}
              />
              <Box className="flex justify-end mt-4">
                <Button variant="contained" onClick={handleCloseModal}>
                  저장
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>

      <Modal open={openScheduleModal} onClose={handleCloseAddModal}>
        <Box className="p-6 bg-white shadow-lg rounded-lg max-w-md mx-auto mt-20">
          <Typography variant="h6">할 일 추가하기</Typography>
          <TextField
            label="할일 제목"
            fullWidth
            margin="normal"
            defaultValue="제목"
          />
          <TextField
            label="마감 기한"
            type="date"
            fullWidth
            margin="normal"
            defaultValue="2025-01-01"
          />
          <Box className="flex justify-end mt-4">
            <Button variant="contained" onClick={handleCloseModal}>
              저장
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
}
