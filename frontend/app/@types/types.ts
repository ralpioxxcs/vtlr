declare module "Type" {
  type ScheduleList = {
    id: string;
    updatedAt: string;
    createdAt: string;
    title: string;
    description: string;
    type: "one_time" | "recurring";
    category: "event" | "on_time" | "routine";
    interval: string;
    active: boolean;
    removeOnComplete: boolean;
    tasks: {
      id: string;
      updatedAt: string;
      createdAt: string;
      status: "pending" | "completed";
      text: string;
      volume: number;
      language: string;
      result: any;
      attemps: number;
    }[];
  };

  type Device = {
    id: string;
    name: string;
    ip: string;
    volume: number;
  };

  type Schedule = {
    id: string;
    title: string;
    description: string;
    type: string;
    category: string;
    interval: string;
    active: boolean;
    removeOnComplete: boolean;
    createdAt: string;
    updatedAt: string;
  };

  type Task = {
    // id: string;
    // title: string;
    // description: string;
    // status: string;
    // text: string;
    // language: string;
    // createdAt: string;
    // updatedAt: string;
    id: string;
    title: string;
    completed: boolean;
    dueDate: string;
    subTasks: SubTask[];
  };

  type SubTask = {
    id: string;
    title: string;
    completed: boolean;
  };
}
