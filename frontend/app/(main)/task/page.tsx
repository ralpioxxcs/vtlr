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

export default function Home() {
  const [tasks, setSchedule] = useState<Schedule[]>(initialSchedules);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [openModal, setOpenModal] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTask, setMenuTask] = useState<Schedule | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [addModalOpen, setAddModalOpen] = useState(false);

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

  const handleOpenModal = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedSchedule(null);
  };

  const handleOpenAddModal = () => {
    setAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setAddModalOpen(false);
  };

  return (
    <div className="w-full max-w-md mt-4 p-4 bg-gray-100">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h5">할일 목록</Typography>
        <IconButton onClick={handleOpenAddModal}>
          <AddIcon />
        </IconButton>
      </div>

      <div className="space-y-4">
        {tasks.map((schedule) => (
          <Box
            key={schedule.id}
            className="p-4 bg-white shadow-md rounded-xl cursor-pointer"
            onClick={() => handleToggleExpand(schedule.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-col items-center space-y-1">
                <Typography className="text-md font-normal overflow-hidden whitespace-nowrap text-ellipsis w-40">
                  {schedule.title}
                </Typography>
                <Typography className="text-sm text-gray-500">
                  마감일: {schedule.endDate || "없음"}
                </Typography>
              </div>
              <IconButton onClick={(e) => handleOpenMenu(e, schedule)}>
                <MoreVertIcon />
              </IconButton>
            </div>

            {/* Sub-tasks (폴딩 가능) */}
            <Collapse in={expanded[schedule.id]} timeout="auto" unmountOnExit>
              <List>
                {schedule.tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <Checkbox
                      checked={task.status === "completed"}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => handleSubTaskToggle(schedule.id, task.id)}
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
                ))}
              </List>
            </Collapse>
          </Box>
        ))}
      </div>

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

      <Modal open={openModal} onClose={handleCloseAddModal}>
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
    </div>
  );
}
