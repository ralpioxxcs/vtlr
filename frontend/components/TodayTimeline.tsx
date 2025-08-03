
'use client';

import { Spinner } from '@heroui/react';
import TodayScheduleCard from './TodayScheduleCard';

interface ITodayTimelineProps {
  schedules: any[];
  isLoading: boolean;
  onTimeClick: (hour: number) => void; // New prop
}

const TodayTimeline = ({ schedules, isLoading, onTimeClick }: ITodayTimelineProps) => {
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>;
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getSchedulesForHour = (hour: number) => {
    return schedules
      .filter(schedule => {
        const scheduleDate = new Date(schedule.schedule_config.datetime);
        return scheduleDate.getHours() === hour;
      })
      .sort((a, b) => new Date(a.schedule_config.datetime).getTime() - new Date(b.schedule_config.datetime).getTime());
  };

  return (
    <div className="space-y-4">
      {hours.map(hour => {
        const schedulesForHour = getSchedulesForHour(hour);
        return (
          <div key={hour} className="flex gap-4 items-start">
            <div 
              className="w-16 text-right text-sm text-gray-500 cursor-pointer hover:text-blue-600 transition-colors"
              onClick={() => onTimeClick(hour)}
            >
              {hour}:00
            </div>
            <div className="flex-1 border-t border-gray-200 pt-2">
              {schedulesForHour.length > 0 ? (
                schedulesForHour.map(schedule => (
                  <TodayScheduleCard key={schedule.id} queryId="todaySchedules" schedule={schedule} />
                ))
              ) : (
                <div className="h-8"></div> // Placeholder for empty hours
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TodayTimeline;
