"use client";

import { useState } from "react";
import {
  Checkbox,
  Typography,
  IconButton,
  Collapse,
  Modal,
  Box,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Popover,
  MenuItem,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { Task } from "Type";
import { initialTasks } from "@/public/data/task";

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
  const [openModal, setOpenModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuTask, setMenuTask] = useState<Task | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Task 완료 체크박스 핸들러
  const handleTaskToggle = (taskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    );
  };

  // Sub-task 완료 체크박스 핸들러
  const handleSubTaskToggle = (taskId: string, subTaskId: string) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              subTasks: task.subTasks.map((subTask) =>
                subTask.id === subTaskId
                  ? { ...subTask, completed: !subTask.completed }
                  : subTask,
              ),
            }
          : task,
      ),
    );
  };

  // Task 폴딩 토글
  const handleToggleExpand = (taskId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // 세부 설정 Modal 열기
  const handleOpenModal = (task: Task) => {
    setSelectedTask(task);
    setOpenModal(true);
  };

  // 세부 설정 Modal 닫기
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedTask(null);
  };

  // 점 세 개 메뉴 열기
  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, task: Task) => {
    setMenuAnchor(event.currentTarget);
    setMenuTask(task);
  };

  // 점 세 개 메뉴 닫기
  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuTask(null);
  };

  // Task 추가 Modal 열기
  const handleOpenAddModal = () => {
    setAddModalOpen(true);
  };

  // Task 추가 Modal 닫기
  const handleCloseAddModal = () => {
    setAddModalOpen(false);
  };

  return (
    <div className="w-full max-w-md mt-4 p-4 bg-gray-100">
      {/* 헤더 영역 */}
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h5">할일 목록</Typography>

        <IconButton onClick={handleOpenAddModal}>
          <AddIcon />
        </IconButton>
      </div>

      <List className="bg-white shadow-md rounded-lg">
        {tasks.map((task) => (
          <div key={task.id}>
            {/* 메인 Task */}
            <ListItem className="bg-gray-50">
              <ListItemButton onClick={() => handleToggleExpand(task.id)}>
                <ListItemIcon>
                  <IconButton sx={{ fontSize: "small" }}>
                    {expanded[task.id] ? (
                      <ExpandLessIcon fontSize="small" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" />
                    )}
                  </IconButton>
                </ListItemIcon>
                <Checkbox
                  checked={task.completed}
                  onChange={() => handleTaskToggle(task.id)}
                />
                <ListItemText
                  primary={task.title}
                  secondary={`마감일: ${task.dueDate}`}
                />

                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenMenu(e, task);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </ListItemButton>
            </ListItem>

            {/* Sub-tasks (폴딩 가능) */}
            <Collapse in={expanded[task.id]} timeout="auto" unmountOnExit>
              <List disablePadding>
                {task.subTasks.map((subTask) => (
                  <ListItem key={subTask.id} className="pl-12">
                    <Checkbox
                      checked={subTask.completed}
                      onChange={() => handleSubTaskToggle(task.id, subTask.id)}
                    />
                    <ListItemText primary={subTask.title} />
                    <IconButton onClick={(e) => handleOpenMenu(e, subTask)}>
                      <MoreVertIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Collapse>
            <Divider />
          </div>
        ))}
      </List>

      {/* 점 세 개 아이콘 클릭 시 나오는 메뉴 */}
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

      {/* 세부 설정 Modal */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box className="p-6 bg-white shadow-lg rounded-lg max-w-md mx-auto mt-20">
          <Typography variant="h6">세부 설정</Typography>
          {selectedTask && (
            <>
              <TextField
                label="할일 제목"
                fullWidth
                margin="normal"
                defaultValue={selectedTask.title}
              />
              <TextField
                label="마감 기한"
                type="date"
                fullWidth
                margin="normal"
                defaultValue={selectedTask.dueDate}
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
