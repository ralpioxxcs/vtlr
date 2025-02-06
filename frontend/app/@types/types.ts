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
    createdAt: string;
    updatedAt: string;
  };
}
