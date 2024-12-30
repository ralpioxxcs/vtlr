declare module "Type" {
  type ScheduleList = {
    rowId: string;
    updatedAt: string;
    createdAt: string;
    title: string;
    description: string;
    type: "one_time" | "recurring";
    category: "event" | "on_time" | "routine";
    interval: string;
    active: boolean;
    tasks: {
      rowId: string;
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
    rowId: string;
    name: string;
    ip: string;
    volume: number;
    createdAt: string;
    updatedAt: string;
  }
}
