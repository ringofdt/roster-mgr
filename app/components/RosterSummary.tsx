import React from "react";
import { type Worker, type Day, days } from "./types";

interface RosterSummaryProps {
  workers: Worker[];
  weeklyHours: Record<string, number>;
  startTimes: Record<Day, string>;
  endTimes: Record<Day, string>;
  calculateHours: (start: string, end: string) => number;
}

export function RosterSummary({
  workers,
  weeklyHours,
  startTimes,
  endTimes,
  calculateHours,
}: RosterSummaryProps) {
  return (
    <div className="mt-6">
      <div className="p-4 overflow-auto">
        <h2 className="font-semibold mb-2">Roster Summary</h2>
        <table className="w-full border text-sm table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2" style={{ width: "200px" }}>
                Team Member
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="border p-2 text-center"
                  style={{ width: "120px" }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workers.map((worker, widx) => (
              <tr key={widx}>
                <td className="border p-2 align-top">
                  <div className="font-semibold">{worker.name}</div>
                  {worker.title && (
                    <div className="font-medium">{worker.title}</div>
                  )}
                  {worker.remark && (
                    <div className="font-light">{worker.remark}</div>
                  )}
                  <div className="text-xs text-gray-600">
                    {weeklyHours[worker.name]
                      ? `${weeklyHours[worker.name].toFixed(1)} hrs`
                      : ""}
                  </div>
                </td>
                {days.map((day) => {
                  const shift = worker.shifts[day];
                  if (!shift || !shift.editable) {
                    return (
                      <td
                        key={day}
                        className="border p-2 align-top"
                        style={{ height: "68px" }}
                      ></td>
                    );
                  }
                  return (
                    <td
                      key={day}
                      className="border p-2 align-top"
                      style={{ height: "68px" }}
                    >
                      <div className="flex flex-col justify-start gap-1">
                        <div className="flex justify-between items-center gap-1 ">
                          {shift.role && (
                            <div className="font-medium text-sm mb-1">
                              {shift.role}
                            </div>
                          )}
                          <div className="flex items-center text-xs gap-1">
                            {shift.startTime === startTimes[day] && (
                              <div
                                className="w-4 h-4 text-center font-semibold text-gray-900 bg-green-500/75 rounded"
                                title="Opening"
                              >
                                O
                              </div>
                            )}
                            {shift.endTime === endTimes[day] && (
                              <div
                                className="w-4 h-4 text-center font-semibold text-gray-900 bg-red-500/75 rounded"
                                title="Closing"
                              >
                                C
                              </div>
                            )}
                          </div>
                        </div>
                        {shift.startTime && shift.endTime && (
                          <div className="text-xs font-semibold text-gray-600">
                            {shift.startTime} - {shift.endTime}
                          </div>
                        )}

                        <div className="text-xs  text-gray-600">
                          {shift.startTime && shift.endTime
                            ? `${calculateHours(shift.startTime, shift.endTime).toFixed(1)}h`
                            : ""}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
