import React, { useRef } from "react";
import { domToPng, domToJpeg } from "modern-screenshot";
import dayjs from "dayjs";
import { type Worker, type Day, type DailyMemo, days } from "./types";
import {
  BadgeOpening,
  BadgeClosing,
  BadgePaidBreak,
  BadgeMealBreak,
} from "./Badges";
import {
  CameraIcon,
  XMarkIcon,
  CalendarIcon,
} from "@heroicons/react/24/outline";

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
  const rosterRef = useRef<HTMLDivElement>(null);

  // const startDate = weekDates["Mon"];
  // const endDate = weekDates["Sun"];
  const startDate = Object.values(weekDates).at(0);
  const endDate = Object.values(weekDates).at(-1);
  const weekRange = `${dayjs(startDate).format("DD MMM")} - ${dayjs(endDate).format("DD MMM")}`;

  const exportAsImage = async (format: "png" | "jpg" = "png") => {
    if (!rosterRef.current) return;

    try {
      const options = {
        scale: 2,
        backgroundColor: "#ffffff",
      };

      let dataUrl;
      if (format === "jpg") {
        dataUrl = await domToJpeg(rosterRef.current, options);
      } else {
        dataUrl = await domToPng(rosterRef.current, options);
      }

      const link = document.createElement("a");
      link.download = `roster-summary-${dayjs(startDate).format("YYYY-MM-DD")}.${format}`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting image:", error);
      alert("Error exporting image. Please try again.");
    } finally {
    }
  };

  return (
    <div className="p-4 text-gray-800 mt-4">
      {/* Export Button */}
      <div className="flex justify-end mb-4">
        <button
          id="export-button"
          onClick={() => exportAsImage("png")}
          className="flex gap-1 items-center p-1 text-gray-600 hover:outline border rounded cursor-pointer"
        >
          <CameraIcon className="size-5" />
          <span> Export as Image</span>
        </button>
      </div>
      <div ref={rosterRef} className="p-3">
        <div className="grid grid-cols-3 items-end mb-1 ">
          <div>
            <div className="px-2 py-1 rounded ">
              <div className=" text-sm font-medium text-sky-600">
                {weekRange}
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="px-2 text-lg font-normal">{rosterTitle}</div>
            {rosterSubTitle && (
              <div className="px-2 text-base font-light">{rosterSubTitle}</div>
            )}
          </div>
          <div></div>
        </div>
        <table className="w-full border-none table-fixed text-sm lg:text-base">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-0 p-1 w-[120px]">Team</th>
              {days.map((day) => (
                <th key={day} className="border-0 p-1 text-center" style={{}}>
                  <div className="flex flex-col gap-0">
                    <span className="capitalize">{day.toUpperCase()}</span>
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
                <td className="border-t border-gray-300 bg-gray-50 p-1 align-center">
                  <div className="flex flex-col h-full">
                    <div className="flex-1">
                      <div className="">{worker.name}</div>
                      {worker.title && <div className="">{worker.title}</div>}
                      {worker.remark && (
                        <div className="text-xs ">{worker.remark}</div>
                      )}
                    </div>
                    <div className="flex mt-auto">
                      <div className="hidden">
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
                        className="border-t border-l border-gray-300 p-1 align-center"
                        style={{}}
                      >
                        {!shift.editable && (
                          <div className="flex justify-center text-gray-200">
                            <CalendarIcon className="size-5" />
                          </div>
                        )}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={day}
                      className="border-t border-l border-gray-300 p-1 align-top"
                      style={{}}
                    >
                      <div className="flex flex-col justify-start gap-1">
                        <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-1 ">
                          {shift.role && (
                            <div className="font-medium text-[0.95em] break-all">
                              {shift.role}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center">
                          {shift.startTime && shift.endTime && (
                            <div className="flex flex-wrap text-[0.95em]">
                              <div className="">
                                <span
                                  className={`rounded px-0.5 ${shift.startTime === startTimes[day] && "bg-lime-400/50"}`}
                                >
                                  {shift.startTime}
                                </span>
                                <span className="px-0.5">-</span>
                              </div>
                              <span
                                className={`rounded px-0.5 ${shift.endTime === endTimes[day] && "bg-rose-400/50"}`}
                              >
                                {shift.endTime}
                              </span>
                            </div>
                          )}
                          {false && shift.startTime === startTimes[day] && (
                            <BadgeOpening />
                          )}
                          {false && shift.endTime === endTimes[day] && (
                            <BadgeClosing />
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
                    <span className="px-1 bg-lime-400/50">Opening</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1 bg-rose-400/50">Closing</span>
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
                      {memo.trayOfRice > 0 && (
                        <div className="grid gap-0 bg-stone-300/50 p-1 rounded">
                          <span className="justify-self-start text-xs">
                            Rice:
                          </span>
                          <span className="justify-self-center font-medium">
                            {memo.trayOfRice}
                          </span>
                        </div>
                      )}

                      {memo.dutySupervisor && (
                        <div className="grid gap-0 bg-slate-300/50 p-1 rounded">
                          <span className="justify-self-start text-xs">
                            Duty supervisor:
                          </span>
                          <span className="justify-self-center font-medium">
                            {memo.dutySupervisor}
                          </span>
                        </div>
                      )}

                      {memo.oilChanger && (
                        <div className="grid gap-0 text-xs bg-yellow-300/40 p-1 rounded">
                          <span className="justify-self-start ">Oil:</span>
                          <span className="justify-self-center font-medium">
                            {memo.oilChanger}
                          </span>
                        </div>
                      )}
                      {memo.remark && (
                        <div className="grid gap-0 text-xs bg-pink-300/50 p-1 rounded">
                          <span className="justify-self-start ">Remark:</span>
                          <div className="whitespace-pre-wrap break-all font-medium">
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
    </div>
  );
}
