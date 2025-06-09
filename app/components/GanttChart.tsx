import React from "react";
import { type Worker, type Day, days } from "./types";

interface GanttChartProps {
  workers: Worker[];
  startTimes: Record<Day, string>;
  endTimes: Record<Day, string>;
  generateTimeOptions: (start: string, end: string) => string[];
  timeToMinutes: (time: string) => number;
  getColor: (index: number) => string;
}

export function GanttChart({
  workers,
  startTimes,
  endTimes,
  generateTimeOptions,
  timeToMinutes,
  getColor,
}: GanttChartProps) {
  // Move gantt-related logic here
  const earliestStart = Object.values(startTimes).reduce(
    (earliest, time) =>
      timeToMinutes(time) < timeToMinutes(earliest) ? time : earliest,
    "23:59",
  );

  const latestEnd = Object.values(endTimes).reduce(
    (latest, time) =>
      timeToMinutes(time) > timeToMinutes(latest) ? time : latest,
    "00:00",
  );

  const ganttTimes = generateTimeOptions(earliestStart, latestEnd);

  // Move ganttData logic here - transposed to have times as rows, days as columns
  const ganttData = ganttTimes.map((time) =>
    days.map((day) => {
      const timeMinutes = timeToMinutes(time);
      const activeWorkers: {
        workerIndex: number;
        workerName: string;
        role: string;
      }[] = [];

      workers.forEach((worker, widx) => {
        const shift = worker.shifts[day];
        if (shift && shift.editable && shift.role) {
          const startMin = timeToMinutes(shift.startTime);
          const endMin = timeToMinutes(shift.endTime);
          if (timeMinutes >= startMin && timeMinutes < endMin) {
            activeWorkers.push({
              workerIndex: widx,
              workerName: worker.name,
              role: shift.role,
            });
          }
        }
      });

      return activeWorkers;
    }),
  );

  return (
    <div className="text-gray-800 p-4 overflow-auto">
      <h2 className="font-semibold mb-2">
        Gantt Chart: Team Member Time Shifts
      </h2>

      {/* Legend */}
      <div className="flex flex-wrap mb-3 gap-3">
        {workers.map((worker, i) => (
          <div
            key={i}
            className="flex items-center gap-2"
            title={worker.name}
            style={{ cursor: "default" }}
          >
            <div
              className="w-5 h-5 rounded border text-sm text-gray-800 text-center text-middle "
              style={{
                backgroundColor: getColor(i),
              }}
            >
              {i}
            </div>
            <span className="text-xs">{worker.name}</span>
          </div>
        ))}
      </div>

      {/* Gantt Table */}
      <table className=" border text-xs table-fixed ">
        <thead>
          <tr className="bg-gray-100 sticky top-0">
            <th className="border p-1 text-left sticky left-0 bg-gray-100 w-12">
              Time
            </th>
            {days.map((day) => (
              <th key={day} className="border p-1 text-center w-16">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ganttTimes.map((time, tIdx) => (
            <tr key={time} className="hover:bg-gray-50">
              <td className="border p-1 sticky left-0 bg-white font-semibold z-10">
                {time}
              </td>
              {ganttData[tIdx].map((activeWorkers, dIdx) => (
                <td
                  key={dIdx}
                  className="border p-0.5 align-middle"
                  style={{ position: "relative" }}
                  title={
                    activeWorkers.length > 0
                      ? activeWorkers
                          .map((w) => `${w.workerName} (${w.role})`)
                          .join(", ")
                      : ""
                  }
                >
                  <div className="flex content-start gap-1">
                    {activeWorkers.map(({ workerIndex }, idx) => (
                      <div
                        key={idx}
                        title={workers[workerIndex]?.name}
                        className="w-4 h-4 border rounded text-xs text-center"
                        style={{
                          backgroundColor: getColor(workerIndex),
                        }}
                      >
                        {workerIndex}
                      </div>
                    ))}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
