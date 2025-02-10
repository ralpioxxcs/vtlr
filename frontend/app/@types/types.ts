declare module "Type" {
  type Schedule = {
    id: string;
    title: string;
    description: string;
    type: "one_time" | "recurring";
    category: "event" | "on_time" | "routine" | "task";
    interval: string;
    active: boolean;
    removeOnComplete: boolean;
    startDate: string;
    endDate: string;
    tasks: Task[];
    updatedAt: string;
    createdAt: string;
  };

  type Task = {
    id: string;
    title: string;
    description: string;
    status: "pending" | "completed";
    text: string;
    language: string;
    result: any;
    attemps: number;
    userId: string;
    updatedAt: string;
    createdAt: string;
  };

  type Device = {
    id: string;
    name: string;
    ip: string;
    volume: number;
  };
}
