import { ScheduleModel } from "src/schedule/entities/schedule.entity";
import { TaskModel } from "src/task/entites/task.entity";

export type JobPayload = {
  type: string;
  data: object;
};

export type SchedulePayload = ScheduleModel
export type TaskPayload = TaskModel

export type TTSJob = {
  jobId: string;
  text: string;
};

export type CronJob = {
  jobId: string;
  cronExpression: string;
  timeZone: string;
  priority?: number;
  autoRemove?: boolean;
  startTime?: Date;
  endTime?: Date;
  payload: JobPayload;
};
