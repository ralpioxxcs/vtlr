import { Task } from "Type";

export const initialTasks: Task[] = [
  {
    id: "1",
    title: "프로젝트 세팅",
    completed: false,
    dueDate: "2025-02-15",
    subTasks: [
      { id: "1-1", title: "Next.js 설치", completed: true },
      { id: "1-2", title: "MUI & NextUI 설치", completed: false },
    ],
  },
  {
    id: "2",
    title: "프론트엔드 UI 작업",
    completed: false,
    dueDate: "2025-02-20",
    subTasks: [
      { id: "2-1", title: "할일 리스트 테이블 구성", completed: false },
      { id: "2-2", title: "체크박스 기능 추가", completed: false },
    ],
  },
];
