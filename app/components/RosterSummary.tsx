import React, { useRef, useState } from "react";
import { Field, Label, Switch } from "@headlessui/react";
import { toPng } from "html-to-image";
import downloadjs from "downloadjs";
import dayjs from "dayjs";
import { type Worker, type Day, type DailyMemo, days } from "./types";
import { BadgeOpening, BadgeClosing, BreakBadge } from "./Badges";
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
  dailyHours: Record<Day, number>;
  weekDates: Record<Day, Date>;
  rosterTitle: string;
  rosterSubTitle: string;
  calculateBreaks: (hours: number) => string[];
}

export function RosterSummary({
  workers,
  weeklyHours,
  startTimes,
  endTimes,
  dailyMemos,
  dailyHours,
  weekDates,
  rosterTitle,
  rosterSubTitle,
  calculateBreaks,
}: RosterSummaryProps) {
  const rosterRef = useRef<HTMLDivElement>(null);

  const [showHours, setShowHours] = useState(false);

  // const startDate = weekDates["Mon"];
  // const endDate = weekDates["Sun"];
  const startDate = Object.values(weekDates).at(0);
  const endDate = Object.values(weekDates).at(-1);
  const weekRange = `${dayjs(startDate).format("DD MMM")} - ${dayjs(endDate).format("DD MMM")}`;

  const exportSummaryAsPNG = async () => {
    const element = document.getElementById("roster-summary");
    const pngOptions = { backgroundColor: "#FFFFFF" };
    if (element) {
      toPng(element, pngOptions)
        .then((dataUrl: string) => {
          // Create a download link and trigger download
          // const link = document.createElement("a");
          // link.download = `roster-summary-${dayjs(startDate).format("YYYY-MM-DD")}.png`;
          // link.href = dataUrl;
          // link.click();
          const filename = `roster-summary-${dayjs(startDate).format("YYYY-MM-DD")}.png`;
          downloadjs(dataUrl, filename, "image/png");
        })
        .catch((error) => {
          console.error("Could not export table:", error);
          alert("Error exporting image. Please try again.");
        });
    } else {
      alert("table not found");
    }
  };

  const weekTotalHours = Object.values(dailyHours).reduce(
    (sum, val) => sum + val,
    0,
  );
  return (
    <div className="p-4 text-gray-800 mt-4">
      {/* Export Button */}
      <div className="flex justify-end mb-4 gap-3">
        <Field className="flex items-center gap-1">
          <Label>Show Hours</Label>
          <Switch
            checked={showHours}
            onChange={setShowHours}
            className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition data-checked:bg-blue-600"
          >
            <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
          </Switch>
        </Field>

        <button
          id="export-button"
          onClick={() => exportSummaryAsPNG()}
          className="flex gap-1 items-center p-1 text-gray-600 hover:outline border rounded cursor-pointer"
        >
          <CameraIcon className="size-5" />
          <span> Export as Image</span>
        </button>
      </div>
      <div id="roster-summary" ref={rosterRef} className="p-3">
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
        <table className="w-full border-none table-fixed text-sm lg:text-base text-gray-800">
          <thead>
            <tr className="bg-gray-100">
              <th className="border-0 p-1 w-[110px]">Team</th>
              {days.map((day) => (
                <th key={day} className="border-0 p-0.5 text-center" style={{}}>
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
              <tr key={widx} className="h-full">
                <td className="border-t border-gray-300 bg-gray-50 p-1 ">
                  <div className="flex flex-col gap-1 h-full">
                    <div className="flex-1">
                      <div className="">{worker.name}</div>
                      {worker.title && <div className="">{worker.title}</div>}
                      {worker.remark && (
                        <div className="text-[80%] font-light">
                          {worker.remark}
                        </div>
                      )}
                    </div>
                    {showHours && (
                      <div className="mt-auto">
                        <div className="text-xs">
                          {weeklyHours[worker.name]
                            ? `${weeklyHours[worker.name].toFixed(1)} hrs`
                            : ""}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                {days.map((day) => {
                  const shift = worker.shifts[day];
                  if (!shift || !shift.editable) {
                    return (
                      <td
                        key={day}
                        className=" border-t border-l border-gray-300 p-1 align-center"
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
                      className="border-t border-l border-gray-300 p-1 align-top "
                      style={{}}
                    >
                      <div className="flex flex-col gap-1 pb-1 h-full">
                        <div className="flex flex-nowrap justify-between items-center ">
                          {shift.role && (
                            <span className="font-medium text-[0.9em] break-all">
                              {shift.role}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          {shift.startTime && shift.endTime && (
                            <div className="flex flex-nowrap text-[0.9em]">
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
                        <div className="flex flex-row flex-wrap gap-1">
                          {calculateBreaks(shift.hours).map((b) => (
                            <BreakBadge text={b} />
                          ))}
                        </div>
                        {showHours && (
                          <div className="mt-auto">
                            {shift.startTime && shift.endTime && (
                              <div className="text-xs">
                                {shift.hours
                                  ? `${shift.hours?.toFixed(1)}h`
                                  : ""}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            {showHours && (
              <tr className="bg-gray-50 text-xs font-light">
                <td className="border-gray-300 border-t p-1">
                  <span>Total:</span>
                  <span className="text-nowrap block">
                    {weekTotalHours?.toFixed(1)} hrs
                  </span>
                </td>
                {days.map((day) => (
                  <td
                    key={day}
                    className="border-gray-300 border-t border-l p-1 text-center"
                  >
                    {dailyHours[day]?.toFixed(1) || "0.0"} hrs
                  </td>
                ))}
              </tr>
            )}
            <tr className="bg-gray-50">
              <td className="border-t border-gray-300 p-1 align-top">
                <div className="underline font-light">Memo</div>
              </td>
              {days.map((day) => {
                const memo = dailyMemos[day];
                return (
                  <td
                    key={day}
                    className="border-t border-l border-gray-300 p-2 align-top"
                  >
                    {showHours && <div className=""></div>}
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

            <tr>
              <td colSpan={8} className="p-1">
                <div className="underline font-light">Remark</div>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-1">
                    <span className="px-1 bg-lime-400/50">Opening</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-1 bg-rose-400/50">Closing</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    <BreakBadge text="PB" />
                    <span>Paid Break</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <BreakBadge text="MB" /> <span>Meal Break</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <BreakBadge text="PB2" />{" "}
                    <span>
                      2<sup>nd</sup> Paid Break
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <BreakBadge text="MB2" />{" "}
                    <span>
                      2<sup>nd</sup> Meal Break
                    </span>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
