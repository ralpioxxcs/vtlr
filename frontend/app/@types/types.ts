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
      payload: {
        rowId: string;
        updatedAt: string;
        createdAt: string;
        status: string;
        payload: {
          text: string;
          volume: number;
        };
        result: any;
        attemps: number;
      };
      result: any;
      attemps: number;
    }[];
  };
}
