import React from "react";
import dayjs from "dayjs";
import { type Worker, type Day, type DailyMemo, days } from "./types";
import {
  BadgeOpening,
  BadgeClosing,
  BadgePaidBreak,
  BadgeMealBreak,
} from "./Badges";

interface RosterSummaryProps {
  workers: Worker[];
  weeklyHours: Record<string, number>;
  startTimes: Record<Day, string>;
  endTimes: Record<Day, string>;
  dailyMemos: Record<Day, DailyMemo>;
  weekDates: Record<Day, Date>;
  rosterTitle: string;
  rosterSubTitle: string;
  calculateHours: (start: string, end: string) => number;
}

export function RosterSummary({
  workers,
  weeklyHours,
  startTimes,
  endTimes,
  dailyMemos,
  weekDates,
  rosterTitle,
  rosterSubTitle,
  calculateHours,
}: RosterSummaryProps) {
  // const startDate = weekDates["Mon"];
  // const endDate = weekDates["Sun"];
  const startDate = Object.values(weekDates).at(0);
  const endDate = Object.values(weekDates).at(-1);
  const weekRange = `${dayjs(startDate).format("DD MMM")} - ${dayjs(endDate).format("DD MMM")}`;

  return (
    <div className="p-4 text-gray-800 mt-4">
      <div className="grid grid-cols-3 items-end mb-1 ">
        <div>
          <div className="px-2 py-1 rounded ">
            <div className=" font-medium text-sky-600">{weekRange}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="px-2 text-2xl font-normal">{rosterTitle}</div>
          {rosterSubTitle && (
            <div className="px-2 text-lg font-light">{rosterSubTitle}</div>
          )}
        </div>
        <div></div>
      </div>
      <table className="w-full border-none table-fixed text-xs md:text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-0 p-2 w-[120px]">Team</th>
            {days.map((day) => (
              <th key={day} className="border-0 p-2 text-center" style={{}}>
                <div className="flex flex-col gap-0">
                  <span>{day}</span>
                  <span className="text-xs font-normal">
                    {dayjs(weekDates[day]).format("DD MMM, YYYY")}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {workers.map((worker, widx) => (
            <tr key={widx}>
              <td className="border-t border-gray-300 bg-gray-50 p-2 align-top">
                <div className="flex flex-col h-full">
                  <div className="flex-1">
                    <div className="text-base">{worker.name}</div>
                    {worker.title && <div className="">{worker.title}</div>}
                    {worker.remark && (
                      <div className="text-xs ">{worker.remark}</div>
                    )}
                  </div>
                  <div className="flex mt-auto">
                    <div className="text-xs">
                      {weeklyHours[worker.name]
                        ? `${weeklyHours[worker.name].toFixed(1)} hrs`
                        : ""}
                    </div>
                  </div>
                </div>
              </td>
              {days.map((day) => {
                const shift = worker.shifts[day];
                if (!shift || !shift.editable) {
                  return (
                    <td
                      key={day}
                      className="border-t border-l border-gray-300 p-2 align-top"
                      style={{}}
                    ></td>
                  );
                }
                return (
                  <td
                    key={day}
                    className="border-t border-l border-gray-300 p-2 align-top"
                    style={{}}
                  >
                    <div className="flex flex-col justify-start gap-1">
                      <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-1 ">
                        {shift.role && (
                          <div className="font-medium">{shift.role}</div>
                        )}
                        <div className="flex items-center text-xs gap-1">
                          {shift.startTime === startTimes[day] && (
                            <BadgeOpening />
                          )}
                          {shift.endTime === endTimes[day] && <BadgeClosing />}
                        </div>
                      </div>
                      <div className="flex">
                        {shift.startTime && shift.endTime && (
                          <div className="">
                            {shift.startTime} - {shift.endTime}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {shift.startTime && shift.endTime && (
                          <div className="hidden text-xs">
                            {calculateHours(
                              shift.startTime,
                              shift.endTime,
                            ).toFixed(1)}
                            h
                          </div>
                        )}

                        {shift.paidBreak && <BadgePaidBreak />}
                        {shift.mealBreak && <BadgeMealBreak />}
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-gray-50">
            <td className="border-t border-gray-300 p-2 align-top">
              <div className="">Daily Memo</div>
              <div className="grid gap-0.5 mt-3 text-xs">
                <div className="underline">Remark</div>
                <div className="flex items-center gap-2">
                  <BadgeOpening /> <span>Opening</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeClosing /> <span>Closing</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgePaidBreak /> <span>Paid Break</span>
                </div>
                <div className="flex items-center gap-2">
                  <BadgeMealBreak /> <span>Meal Break</span>
                </div>
              </div>
            </td>
            {days.map((day) => {
              const memo = dailyMemos[day];
              return (
                <td
                  key={day}
                  className="border-t border-l border-gray-300 p-2 align-top"
                >
                  <div className="space-y-1">
                    {memo.dutySupervisor && (
                      <div className="grid gap-0 text-xs bg-blue-300/50 p-1 rounded">
                        <span className="justify-self-start font-medium">
                          Duty supervisor:
                        </span>
                        <span className="justify-self-center">
                          {memo.dutySupervisor}
                        </span>
                      </div>
                    )}

                    {memo.trayOfRice > 0 && (
                      <div className="grid gap-0 text-xs bg-stone-300/50 p-1 rounded">
                        <span className="justify-self-start font-medium">
                          Rice:
                        </span>
                        <span className="justify-self-center">
                          {memo.trayOfRice}
                        </span>
                      </div>
                    )}

                    {memo.oilChanger && (
                      <div className="grid gap-0 text-xs bg-yellow-300/40 p-1 rounded">
                        <span className="justify-self-start font-medium">
                          Oil:
                        </span>
                        <span className="justify-self-center">
                          {memo.oilChanger}
                        </span>
                      </div>
                    )}
                    {memo.remark && (
                      <div className="grid gap-0 text-xs bg-pink-300/50 p-1 rounded">
                        <span className="justify-self-start font-medium">
                          Remark:
                        </span>
                        <div className="whitespace-pre-wrap break-all">
                          {memo.remark}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
