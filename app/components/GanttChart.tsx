import React from "react";
import { type Worker, type Day, days } from "./types";

interface GanttChartProps {
  workers: Worker[];
  startTimes: Record<Day, string>;
  endTimes: Record<Day, string>;
  generateTimeOptions: (start: string, end: string) => string[];
  timeToMinutes: (time: string) => number;
}

export function GanttChart({
  workers,
  startTimes,
  endTimes,
  generateTimeOptions,
  timeToMinutes,
}: GanttChartProps) {
  function getColor(index: number): string {
    const hue = (index * 137.508) % 360;
    return `hsl(${hue}, 65%, 75%)`;
  }

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
      const workerStates = workers
        .map((worker, widx) => {
          const shift = worker.shifts[day];
          let isActive = false;
          let hasShiftForDay = false;

          if (
            shift &&
            shift.editable &&
            shift.role &&
            shift.startTime &&
            shift.endTime
          ) {
            hasShiftForDay = true;
            const startMin = timeToMinutes(shift.startTime);
            const endMin = timeToMinutes(shift.endTime);
            isActive = timeMinutes >= startMin && timeMinutes < endMin;
          }

          return {
            workerIndex: widx,
            workerName: worker.name,
            role: shift?.role || "",
            isActive,
            hasShiftForDay,
          };
        })
        .filter((worker) => worker.hasShiftForDay);

      return workerStates;
    }),
  );

  return (
    <div className="text-gray-800 p-4 overflow-auto">
      <h2 className="font-semibold mb-2">Team Time Shifts</h2>

      {/* Legend */}
      <div className="flex flex-wrap mb-3 gap-3">
        {workers.map((worker, i) => (
          <div
            key={i}
            className="flex items-center gap-1"
            title={worker.name}
            style={{ cursor: "default" }}
          >
            <div
              className="w-5 h-5 rounded text-sm  text-center text-middle "
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
      <table className=" border-0 text-xs table-fixed ">
        <thead>
          <tr className="bg-gray-100 sticky top-0">
            <th className="border-0 p-1 text-left sticky left-0 bg-gray-100 z-10 w-12">
              Time
            </th>
            {days.map((day) => (
              <th key={day} className="border-0 p-1 text-center">
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ganttTimes.map((time, tIdx) => (
            <tr key={time} className="hover:bg-gray-100">
              <td className="border-t border-gray-300 p-1 sticky left-0 bg-gray-50 font-semibold z-10">
                {time}
              </td>
              {ganttData[tIdx].map((activeWorkers, dIdx) => (
                <td
                  key={dIdx}
                  className="border-l border-gray-300 border-l-gray-600 px-1 align-middle"
                  style={{ position: "relative" }}
                  title={ganttData[tIdx][dIdx]
                    .filter((w) => w.isActive)
                    .map((w) => `${w.workerName} (${w.role})`)
                    .join(", ")}
                >
                  <div className="flex flex-wrap gap-1 px-1">
                    {ganttData[tIdx][dIdx].map(
                      ({ workerIndex, isActive }, idx) => (
                        <div
                          key={idx}
                          title={workers[workerIndex]?.name}
                          className="w-4 h-4  rounded text-xs text-center"
                          style={{
                            backgroundColor: isActive
                              ? getColor(workerIndex)
                              : "transparent",
                            opacity: isActive ? 1 : 0.3,
                          }}
                        >
                          {isActive ? workerIndex : ""}
                        </div>
                      ),
                    )}
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
