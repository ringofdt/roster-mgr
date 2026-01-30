import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import clsx from "clsx";
import {
  Select,
  Checkbox,
  Label,
  Field,
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import {
  ArrowPathIcon,
  XCircleIcon,
  XMarkIcon,
  PlusCircleIcon,
  CursorArrowRaysIcon,
  PlusIcon,
  MinusIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";

import {
  type Worker,
  type Day,
  type Shift,
  type DailyMemo,
  days,
} from "../components/types";
import { GanttChart } from "../components/GanttChart";
import { RosterSummary } from "../components/RosterSummary";
import { DailyMemoController } from "../components/DailyMemoController";
import { BadgeOpening, BadgeClosing, BreakBadge } from "../components/Badges";

const defaultStartTimes: Record<Day, string> = {
  Mon: "07:30",
  Tue: "07:30",
  Wed: "07:30",
  Thu: "07:30",
  Fri: "07:30",
  Sat: "07:30",
  Sun: "08:00",
};

const defaultEndTimes: Record<Day, string> = {
  Mon: "18:00",
  Tue: "18:00",
  Wed: "18:00",
  Thu: "19:00",
  Fri: "18:00",
  Sat: "17:00",
  Sun: "17:00",
};

const defaultRoleList: string[] = [
  "Roll",
  "Nigiri",
  "Inari",
  "Service",
  "Closing",
];

const defaultBreakMinHours: Record<string, number> = {
  PB: 4,
  MB: 5,
  PB2: 9.5,
  MB2: 10,
};

function generateTimeOptions(start: string, end: string): string[] {
  const options: string[] = [];
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let time = sh * 60 + sm;
  const endTime = eh * 60 + em;
  while (time <= endTime) {
    const h = String(Math.floor(time / 60)).padStart(2, "0");
    const m = String(time % 60).padStart(2, "0");
    options.push(`${h}:${m}`);
    time += 30;
  }
  return options;
}

function generateDayTimeOptions(
  day: Day,
  startTimes: Record<Day, string>,
  endTimes: Record<Day, string>,
): string[] {
  return generateTimeOptions(startTimes[day], endTimes[day]);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// Date helper functions
function getFirstMondayOfJuly(year: number): Date {
  // Start with July 1st
  const july1 = new Date(year, 6, 1); // Month is 0-indexed, so 6 = July
  const dayOfWeek = july1.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate days to add to get to the first Monday
  // If July 1st is Sunday (0), add 1 day. If Monday (1), add 0 days, etc.
  const daysToAdd = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : 8 - dayOfWeek;

  const firstMonday = new Date(year, 6, 1 + daysToAdd);
  return firstMonday;
}

function getFinancialYearStartDate(year: number): Date {
  // July 1st of the financial year
  const julyFirst = new Date(year, 6, 1); // July = 6

  // Find the Monday of the week containing July 1st
  const dayOfWeek = julyFirst.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const offsetToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const firstWeekMonday = new Date(julyFirst);
  firstWeekMonday.setDate(julyFirst.getDate() + offsetToMonday);
  return firstWeekMonday;
}

function getWeekStartDate(year: number, weekNumber: number): Date {
  const yearStartDate = getFinancialYearStartDate(year);
  const startDate = new Date(yearStartDate);
  startDate.setDate(yearStartDate.getDate() + (weekNumber - 1) * 7);
  return startDate;
}

function getWeekDates(year: number, weekNumber: number): Record<Day, Date> {
  const monday = getWeekStartDate(year, weekNumber);
  const dates: Record<Day, Date> = {} as Record<Day, Date>;

  days.forEach((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    dates[day] = date;
    // `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
  });

  return dates;
}

function getFinancialYearAndWeek(date: Date): { year: number; week: number } {
  const y = date.getFullYear();
  const week1Start = getFinancialYearStartDate(y);
  const fyStartDate =
    date < week1Start ? getFinancialYearStartDate(y - 1) : week1Start;
  const fiscalYear = fyStartDate.getFullYear();

  const diffInDays = Math.floor(
    (date.getTime() - fyStartDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  const week = Math.floor(diffInDays / 7) + 1;
  return { year: fiscalYear, week };
}

function getCurrentWeekInfo(): { year: number; week: number } {
  const today = new Date();
  return getFinancialYearAndWeek(today);
}

export default function RosterApp(): React.JSX.Element {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<Record<string, number>>({});
  const [dailyTotals, setDailyTotals] = useState<Record<Day, number>>(
    Object.fromEntries(days.map((d) => [d, 0])) as Record<Day, number>,
  );

  const [weekTotalHours, setWeekTotalHours] = useState(0);
  const [newRole, setNewRole] = useState<string>("");

  const [roleList, setRoleList] = useState<string[]>(defaultRoleList);

  const [startTimes, setStartTimes] =
    useState<Record<Day, string>>(defaultStartTimes);
  const [endTimes, setEndTimes] =
    useState<Record<Day, string>>(defaultEndTimes);
  const [breakMinHours, setBreakMinHours] =
    useState<Record<string, number>>(defaultBreakMinHours);

  const [newWorkerName, setNewWorkerName] = useState<string>("");
  const [newWorkerTitle, setNewWorkerTitle] = useState<string>("");
  const [newWorkerRemark, setNewWorkerRemark] = useState<string>("");
  const [newWorkerDays, setNewWorkerDays] = useState<Record<Day, boolean>>(
    Object.fromEntries(days.map((d) => [d, true])) as Record<Day, boolean>,
  );

  const calculateBreaks = (hours: number): string[] => {
    const result: string[] = [];

    const breaks: string[] = ["PB", "MB", "MB2", "PB2"];

    for (const b of breaks) {
      if (b == "PB2" && result.includes("MB2")) break;
      const minHours = breakMinHours[b];
      if (minHours > 0 && hours >= minHours) {
        result.push(b);
      }
    }
    return result;
  };

  // Year and Week state
  const currentWeekInfo = getCurrentWeekInfo();
  const [selectedYear, setSelectedYear] = useState<number>(
    currentWeekInfo.year,
  );
  const [selectedWeek, setSelectedWeek] = useState<number>(
    currentWeekInfo.week,
  );
  const weekDates = getWeekDates(selectedYear, selectedWeek);

  const [rosterTitle, setRosterTitle] = useState<string>("");
  const [rosterSubTitle, setRosterSubTitle] = useState<string>("");

  // Daily Memo state
  const [dailyMemos, setDailyMemos] = useState<Record<Day, DailyMemo>>(
    Object.fromEntries(
      days.map((d) => [
        d,
        { dutySupervisor: "", oilChanger: "", trayOfRice: 0, remark: "" },
      ]),
    ) as Record<Day, DailyMemo>,
  );

  const updateDailyMemo = (
    day: Day,
    field: keyof DailyMemo,
    value: string | number,
  ) => {
    const updated = { ...dailyMemos };
    (updated[day] as any)[field] = value;
    setDailyMemos(updated);
  };

  const calculateHours = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(0, eh + em / 60 - (sh + sm / 60));
  };

  const incrementWeek = () => {
    const nextWeek = selectedWeek + 1;
    const nextWeekDate = getWeekStartDate(selectedYear, nextWeek);
    const { year, week } = getFinancialYearAndWeek(nextWeekDate);
    setSelectedYear(year);
    setSelectedWeek(week);
  };

  const decrementWeek = () => {
    const selectedWeekDate = getWeekStartDate(selectedYear, selectedWeek);
    let prevWeekDate = new Date(selectedWeekDate);
    prevWeekDate.setDate(selectedWeekDate.getDate() - 7);
    const { year, week } = getFinancialYearAndWeek(prevWeekDate);
    setSelectedYear(year);
    setSelectedWeek(week);
  };

  useEffect(() => {
    const newWeeklyHours: Record<string, number> = {};
    const newDailyTotals: Record<Day, number> = Object.fromEntries(
      days.map((d) => [d, 0]),
    ) as Record<Day, number>;

    workers.forEach((worker) => {
      let total = 0;
      days.forEach((day) => {
        const shift = worker.shifts[day];
        if (shift && shift.editable) {
          const hrs = calculateHours(shift.startTime, shift.endTime);
          total += hrs;
          newDailyTotals[day] += hrs;
        }
      });
      newWeeklyHours[worker.name || "Unnamed"] = total;
    });
    const newWeekTotalHours = Object.values(newDailyTotals).reduce(
      (sum, val) => sum + val,
      0,
    );
    setWeeklyHours(newWeeklyHours);
    setDailyTotals(newDailyTotals);
    setWeekTotalHours(newWeekTotalHours);
  }, [workers]);

  const updateWorkerField = (
    index: number,
    field: keyof Worker,
    value: any,
  ) => {
    const updated = [...workers];
    (updated[index] as any)[field] = value;
    setWorkers(updated);
  };

  const updateShift = (
    workerIndex: number,
    day: Day,
    field: "startTime" | "endTime" | "role" | "paidBreak" | "mealBreak",
    value: string,
  ) => {
    const updated = [...workers];
    // if (!updated[workerIndex].shifts[day].editable) return;
    updated[workerIndex].shifts[day][field] = value;
    if (["startTime", "endTime"].includes(field)) {
      const shift = updated[workerIndex].shifts[day];
      const hrs = calculateHours(shift.startTime, shift.endTime);
      updated[workerIndex].shifts[day]["hours"] = hrs;
      // updated[workerIndex].shifts[day]["mealBreak"] = hrs >= 5 ? "MB" : "";
      // updated[workerIndex].shifts[day]["paidBreak"] = hrs >= 4 ? "PB" : "";
    }
    setWorkers(updated);
  };

  const updateShiftHours = () => {
    const updated = workers.map((worker) => {
      const newShifts = { ...worker.shifts };

      days.forEach((day) => {
        const shift = newShifts[day];
        if (shift) {
          const hrs = calculateHours(shift.startTime, shift.endTime);
          newShifts[day] = { ...shift, hours: hrs };
        }
      });

      return { ...worker, shifts: newShifts };
    });
    setWorkers(updated);
  };

  const resetShift = (workerIndex: number, day: Day) => {
    const updated = [...workers];
    if (!updated[workerIndex].shifts[day].editable) return;
    updated[workerIndex].shifts[day] = {
      startTime: "",
      endTime: "",
      role: "",
      hours: 0,
      paidBreak: "",
      mealBreak: "",
      editable: true,
    };
    setWorkers(updated);
  };

  const toggleDayForNewWorker = (day: Day) => {
    setNewWorkerDays((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const addWorkerRow = () => {
    const disabledShiftData: Shift = {
      startTime: "",
      endTime: "",
      role: "",
      hours: 0,
      paidBreak: "",
      mealBreak: "",
      editable: false,
    };
    const shifts: Record<Day, Shift> = {} as Record<Day, Shift>;

    days.forEach((d) => {
      if (newWorkerDays[d]) {
        shifts[d] = {
          startTime: "",
          endTime: "",
          role: "",
          hours: 0,
          paidBreak: "",
          mealBreak: "",
          editable: true,
        };
      } else {
        shifts[d] = { ...disabledShiftData };
      }
    });

    const newWorker: Worker = {
      name: newWorkerName.trim(),
      title: newWorkerTitle.trim(),
      remark: newWorkerRemark.trim(),
      shifts,
    };
    setWorkers([...workers, newWorker]);
    setNewWorkerName("");
    setNewWorkerTitle("");
    setNewWorkerRemark("");

    // setNewWorkerDays(
    //   Object.fromEntries(days.map((d) => [d, true])) as Record<Day, boolean>,
    // );
  };

  const removeWorker = (workerIndex: number) => {
    const updated = workers.filter((_, index) => index !== workerIndex);
    setWorkers(updated);
  };

  const saveSettingsToFile = () => {
    const settings = {
      roles: roleList,
      startTimes: startTimes,
      endTimes: endTimes,
      breakMinHours: breakMinHours,
      workers: workers,
      dailyMemos: dailyMemos,
      rosterInfo: {
        title: rosterTitle,
        subtitle: rosterSubTitle,
        year: selectedYear,
        week: selectedWeek,
      },
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `roster-settings-${dayjs().format("YYYYMMDDTHHmmss")}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const processSettingsFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const settings = JSON.parse(content);

        if (settings.roles && Array.isArray(settings.roles)) {
          setRoleList(settings.roles);
        }

        if (settings.startTimes) {
          setStartTimes(settings.startTimes);
        }

        if (settings.endTimes) {
          setEndTimes(settings.endTimes);
        }
        if (settings.breakMinHours) {
          setBreakMinHours(settings.breakMinHours);
        }

        if (settings.workers && Array.isArray(settings.workers)) {
          // Validate worker structure
          const validWorkers = settings.workers.filter(
            (worker: any) =>
              worker &&
              typeof worker.name === "string" &&
              worker.shifts &&
              typeof worker.shifts === "object",
          );

          setWorkers(validWorkers);
          // updateShiftHours();
        }

        if (settings.dailyMemos) {
          setDailyMemos(settings.dailyMemos);
        }

        if (settings.rosterInfo) {
          setSelectedWeek(settings.rosterInfo.week);
          setSelectedYear(settings.rosterInfo.year);
          setRosterTitle(settings.rosterInfo.title);
          setRosterSubTitle(settings.rosterInfo.subtitle);
        }
      } catch (error) {
        alert("Error loading settings file. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  const loadSettingsFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    processSettingsFile(file);

    // Reset the input value so the same file can be selected again
    event.target.value = "";
  };

  const handleSettingsDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === "application/json") {
      processSettingsFile(file);
    } else {
      alert("Please drop a valid JSON file.");
    }
  };

  const handleSettingsDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const toggleDayForExistingWorker = (workerIndex: number, day: Day) => {
    const updated = [...workers];
    const shift = updated[workerIndex].shifts[day];
    if (shift.editable) {
      updated[workerIndex].shifts[day] = {
        startTime: "",
        endTime: "",
        role: "",
        hours: 0,
        paidBreak: "",
        mealBreak: "",
        editable: false,
      };
    } else {
      updated[workerIndex].shifts[day] = {
        startTime: "",
        endTime: "",
        role: "",
        hours: 0,
        paidBreak: "",
        mealBreak: "",
        editable: true,
      };
    }
    setWorkers(updated);
  };

  return (
    <div className="p-3 max-w-6xl mx-auto text-gray-800">
      <h1 className="text-2xl font-bold mb-4">Roster made simple</h1>

      <div className="">
        <div className="p-2 space-y-4">
          <div className="flex flex-col gap-4 pb-4 border-b">
            <div className="flex flex-col gap-2 ">
              <label className="font-semibold"></label>
              <div className="flex gap-2 items-center">
                <button
                  onClick={saveSettingsToFile}
                  className="flex items-center p-1 text-gray-600 hover:outline border rounded cursor-pointer"
                >
                  <span className="text-xs sm:text-sm md:text-md">
                    Save Settings
                  </span>
                </button>
                <div
                  className=" flex-1 justify-center rounded-lg w-80% border border-dashed border-gray-900/25 px-3 py-2 bg-gray-200 hover:bg-gray-100 transition-colors"
                  onDrop={handleSettingsDrop}
                  onDragOver={handleSettingsDragOver}
                >
                  <div className="flex text-sm/6 text-gray-600">
                    <label htmlFor="settings-file-input" className="relative ">
                      <span className="text-xs p-1 hover:outline border rounded cursor-pointer">
                        Load Settings
                      </span>

                      <input
                        id="settings-file-input"
                        name="settings-file-input"
                        type="file"
                        accept=".json"
                        onChange={loadSettingsFromFile}
                        className="sr-only"
                      />
                      <span className="pl-1">or drag and drop</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <Disclosure>
              {({ open }) => (
                <>
                  <DisclosureButton className="flex items-center gap-2">
                    show settings
                    <ChevronRightIcon
                      className={clsx("w-5", open && "rotate-90")}
                    />
                  </DisclosureButton>
                  <DisclosurePanel
                    transition
                    className=" origin-top transition duration-200 ease-out data-closed:-translate-y-6 data-closed:opacity-0"
                  >
                    <div className="flex flex-col gap-2 bg-gray-100 px-2 py-3">
                      <div className=" gap-1">
                        <label className="font-semibold">Shifts</label>
                        <div className="flex flex-wrap gap-1">
                          {days.map((day) => (
                            <div
                              key={day}
                              className="flex items-right flex-col gap-1 text-sm"
                            >
                              <label className="w-18">{day}</label>
                              <input
                                type="time"
                                value={startTimes[day]}
                                onChange={(e) =>
                                  setStartTimes({
                                    ...startTimes,
                                    [day]: e.target.value,
                                  })
                                }
                                className="w-20 border rounded px-1 py-1"
                              />
                              <input
                                type="time"
                                value={endTimes[day]}
                                onChange={(e) =>
                                  setEndTimes({
                                    ...endTimes,
                                    [day]: e.target.value,
                                  })
                                }
                                className="w-20 border rounded px-1 py-1"
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className=" gap-1">
                        <label className="font-semibold">
                          Breaks' Shift Hours
                        </label>
                        <div className="flex flex-wrap md:flex-row md:flex-wrap gap-1">
                          {["PB", "MB", "PB2", "MB2"].map((b) => (
                            <div
                              key={b}
                              className="flex items-left flex-col gap-1 text-sm"
                            >
                              <label className="w-18">{b}</label>
                              <div className="flex items-center gap-1 rounded-sm outline-1 p-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={breakMinHours[b]}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) =>
                                    setBreakMinHours({
                                      ...breakMinHours,
                                      [b]: parseFloat(e.target.value) || 0.0,
                                    })
                                  }
                                  className="w-10 border-0 rounded p-0 text-center  focus:outline-none"
                                />
                                <div className="grid shrink-0 grid-cols-1 focus-within:relative">
                                  hrs
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 ">
                        <label className="font-semibold">Roles</label>

                        <div className="flex w-full">
                          <div className="flex w-full sm:w-80 items-center rounded-md pl-3 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2">
                            <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
                              <XMarkIcon className="hidden size-3" />
                            </div>
                            <input
                              type="text"
                              name="newRole"
                              onChange={(e) => setNewRole(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && newRole.trim()) {
                                  e.preventDefault();
                                  if (!roleList.includes(newRole.trim())) {
                                    setRoleList([...roleList, newRole.trim()]);
                                    setNewRole("");
                                  }
                                }
                              }}
                              className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                              placeholder="Role"
                            />
                            <div className="flex shrink-0 items-center focus-within:relative">
                              <button
                                className="flex gap-1 items-center px-2 py-1 text-gray-600  cursor-pointer hover:bg-gray-100/60"
                                onClick={() => {
                                  if (
                                    newRole.trim() &&
                                    !roleList.includes(newRole.trim())
                                  ) {
                                    setRoleList([...roleList, newRole.trim()]);
                                    setNewRole("");
                                  }
                                }}
                              >
                                <PlusCircleIcon className=" size-5" />
                                <span>Add </span>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row flex-wrap gap-2">
                          {roleList.map((role, idx) => (
                            <div
                              key={idx}
                              className="flex items-center bg-gray-50 px-1 py-1 rounded text-sm  text-gray-600 ring-1"
                            >
                              <span className="mr-1">{role}</span>
                              <button
                                className="cursor-pointer text-red-400 hover:text-red-600"
                                onClick={() => {
                                  const updated = [...roleList];
                                  updated.splice(idx, 1);
                                  setRoleList(updated);
                                }}
                              >
                                <XCircleIcon className="size-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold">Member</label>

                        <div className="flex flex-row gap-2">
                          <div className="">
                            <div className="flex w-full sm:w-80 items-center rounded-md pl-3 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2">
                              <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
                                <XMarkIcon className="hidden size-3" />
                              </div>
                              <input
                                type="text"
                                value={newWorkerName}
                                onChange={(e) =>
                                  setNewWorkerName(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    addWorkerRow();
                                  }
                                }}
                                className="block min-w-0 grow py-1.5 pr-3 pl-1 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                                placeholder="Name"
                              />
                              <div className="flex shrink-0 items-center focus-within:relative">
                                <button
                                  onClick={addWorkerRow}
                                  className="flex gap-1 items-center px-2 py-1 text-gray-600  cursor-pointer hover:bg-gray-100/60"
                                >
                                  <PlusCircleIcon className=" size-5" />
                                  <span>Add </span>
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className=" flex flex-row flex-wrap gap-2">
                            {days.map((day) => (
                              <Field
                                key={day}
                                className="px-1 border rounded items-center flex border-gray-400"
                              >
                                <Checkbox
                                  checked={newWorkerDays[day]}
                                  onChange={() => toggleDayForNewWorker(day)}
                                  className="group block size-4 mr-0.5 rounded border bg-white data-checked:bg-sky-600"
                                >
                                  {/* Checkmark icon */}
                                  <svg
                                    className="stroke-white opacity-0 group-data-checked:opacity-100"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                  >
                                    <path
                                      d="M3 8L6 11L11 3.5"
                                      strokeWidth={2}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </Checkbox>
                                <Label>{day}</Label>
                              </Field>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </DisclosurePanel>
                </>
              )}
            </Disclosure>
          </div>
        </div>
      </div>
      <div className="p-2 flex flex-wrap gap-3">
        <div className="flex flex-row w-full md:w-1/3 gap-1 ">
          <div className="flex flex-row gap-1">
            <div className="flex flex-col gap-1">
              <label className=" text-xs px-1">Year</label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(
                    parseInt(e.target.value) || new Date().getFullYear(),
                  );
                }}
                min="2020"
                max="2050"
                className="w-18 border rounded px-1 py-1"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="block text-xs px-1">Week</label>
              <input
                type="number"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value) || 1)}
                min="1"
                max="53"
                className="w-12 border rounded px-1 py-1 "
              />
            </div>
          </div>

          <div className=" flex flex-col gap-1">
            <label className="block text-xs px-1">&nbsp;</label>
            <div className="flex flex-row gap-0.5 w-full">
              <button
                onClick={() => {
                  decrementWeek();
                }}
                className="flex flex-row gap-1  items-center px-1 py-2 text-gray-600 cursor-pointer border rounded hover:outline"
              >
                <MinusIcon className="size-4" />
              </button>
              <button
                onClick={() => {
                  const current = getCurrentWeekInfo();
                  setSelectedYear(current.year);
                  setSelectedWeek(current.week);
                }}
                className="flex flex-row gap-1  items-center px-1 py-2 text-gray-600 cursor-pointer border rounded hover:outline"
              >
                <span className="font-light text-xs text-nowrap">
                  This Week
                </span>
              </button>
              <button
                onClick={() => {
                  incrementWeek();
                }}
                className="flex flex-row gap-1  items-center px-1 py-2 text-gray-600 cursor-pointer border rounded hover:outline"
              >
                <PlusIcon className="size-4" />
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 grow gap-1">
          <div className="flex flex-col w-full gap-1 ">
            <label className="block text-xs px-1">Title</label>
            <input
              type="text"
              placeholder=""
              value={rosterTitle}
              onChange={(e) => setRosterTitle(e.target.value)}
              className="border rounded px-2 py-1 "
            />
          </div>
          <div className="flex flex-col w-full gap-1 ">
            <label className="block text-xs px-1">Subtitle</label>
            <input
              type="text"
              placeholder=""
              value={rosterSubTitle}
              onChange={(e) => setRosterSubTitle(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>
      </div>

      {/* Roster Editor */}
      <div>
        <div className="p-2 overflow-auto">
          <table className="w-full border-0 text-sm table-fixed text-gray-800">
            <thead>
              <tr className="bg-gray-100">
                <th className="border-0 p-2 w-[150px]">
                  <div className="">Team</div>
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    className="border-l border-gray-400 p-1 text-center"
                  >
                    <div className="flex flex-col gap-0">
                      <span>{day}</span>
                      <span className="font-normal">
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
                  <td className="border-gray-400 border-b p-2 align-top">
                    <div className="flex-1">
                      <div className="grid gap-1">
                        <input
                          type="text"
                          value={worker.name}
                          onChange={(e) =>
                            updateWorkerField(widx, "name", e.target.value)
                          }
                          className="border-b border-gray-300 px-1 w-full font-semibold"
                          placeholder="Name"
                        />
                        <input
                          type="text"
                          value={worker.title || ""}
                          onChange={(e) =>
                            updateWorkerField(widx, "title", e.target.value)
                          }
                          className="hidden border-b border-gray-300 px-1 w-full font-light"
                          placeholder="Title"
                        />
                        <input
                          type="text"
                          value={worker.remark || ""}
                          onChange={(e) =>
                            updateWorkerField(widx, "remark", e.target.value)
                          }
                          className="border-b border-gray-300 px-1 w-full font-light"
                          placeholder="Remark"
                        />
                      </div>
                      <div className="flex items-center justify-start gap-1 py-2 text-xs">
                        {days.map((day) => (
                          <label key={day} className="">
                            <input
                              type="checkbox"
                              checked={worker.shifts[day]?.editable || false}
                              onChange={() =>
                                toggleDayForExistingWorker(widx, day)
                              }
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs mt-auto">
                      <span className="font-semibold">
                        {weeklyHours[worker.name]
                          ? `${weeklyHours[worker.name]?.toFixed(1)} hrs`
                          : "0.0 hrs"}
                      </span>
                      <button
                        onClick={() => removeWorker(widx)}
                        className="px-0.5  text-red-500 hover:outline border rounded cursor-pointer"
                        title="Remove team member"
                      >
                        <XMarkIcon className="size-4" />
                      </button>
                    </div>
                  </td>
                  {days.map((day) => {
                    const shift = worker.shifts[day];
                    if (!shift || !shift.editable) {
                      return (
                        <td
                          key={day}
                          className="border-gray-400 border-l border-b p-2 align-center"
                          style={{ height: "80px" }}
                        ></td>
                      );
                    }
                    return (
                      <td
                        key={day}
                        className="border-gray-400 border-l border-b p-2 align-top"
                        style={{ height: "80px" }}
                      >
                        <div className="h-full flex flex-col">
                          <div className="flex-1">
                            <div className="grid gap-1">
                              {/* Role Selector */}
                              <div className="flex gap-1">
                                <Select
                                  value={shift.role}
                                  onChange={(e) =>
                                    updateShift(
                                      widx,
                                      day,
                                      "role",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full flex-1 px-0 rounded bg-gray-100"
                                >
                                  <option value=""></option>
                                  {roleList.map((role) => (
                                    <option key={role} value={role}>
                                      {role}
                                    </option>
                                  ))}
                                </Select>
                              </div>
                              {/* Start Shift Selector */}
                              <div className="flex gap-1">
                                <div className="w-4 h-4 flex-shrink-0">
                                  {shift.startTime === startTimes[day] && (
                                    <BadgeOpening />
                                  )}
                                </div>
                                <Select
                                  value={shift.startTime}
                                  onChange={(e) =>
                                    updateShift(
                                      widx,
                                      day,
                                      "startTime",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-0 border-b border-gray-300"
                                >
                                  <option value=""></option>
                                  {generateDayTimeOptions(
                                    day,
                                    startTimes,
                                    endTimes,
                                  ).map((time) => (
                                    <option key={time} value={time}>
                                      {time}
                                    </option>
                                  ))}
                                </Select>
                              </div>
                              {/* End Shift Selector */}
                              <div className="flex gap-1">
                                <div className="w-4 h-4 flex-shrink-0">
                                  {shift.endTime === endTimes[day] && (
                                    <BadgeClosing />
                                  )}
                                </div>
                                <Select
                                  value={shift.endTime}
                                  onChange={(e) =>
                                    updateShift(
                                      widx,
                                      day,
                                      "endTime",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full px-0 border-b border-gray-300"
                                >
                                  <option value=""></option>
                                  {generateDayTimeOptions(
                                    day,
                                    startTimes,
                                    endTimes,
                                  ).map((time) => (
                                    <option key={time} value={time}>
                                      {time}
                                    </option>
                                  ))}
                                </Select>
                              </div>
                              <div className="flex gap-0.5 items-center">
                                {calculateBreaks(shift.hours).map((b) => (
                                  <BreakBadge text={b} />
                                ))}
                              </div>
                              <div>
                                {false && shift.hours >= 4 && (
                                  <div className="flex items-center rounded-md bg-white px-1 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                                    <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
                                      PB
                                    </div>

                                    <input
                                      type="text"
                                      value={shift.paidBreak || ""}
                                      onChange={(e) =>
                                        updateShift(
                                          widx,
                                          day,
                                          "paidBreak",
                                          e.target.value,
                                        )
                                      }
                                      className="border-b border-gray-300 px-1 w-full font-light"
                                      placeholder=""
                                    />
                                  </div>
                                )}
                                {false && shift.hours >= 5 && (
                                  <div className="flex items-center rounded-md bg-white px-1 outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
                                    <div className="shrink-0 text-base text-gray-500 select-none sm:text-sm/6">
                                      MB
                                    </div>
                                    <input
                                      type="text"
                                      value={shift.mealBreak || ""}
                                      onChange={(e) =>
                                        updateShift(
                                          widx,
                                          day,
                                          "mealBreak",
                                          e.target.value,
                                        )
                                      }
                                      className="border-b border-gray-300 px-1 w-full font-light"
                                      placeholder=""
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Bottom row - always at the bottom */}
                          <div>
                            <div className="flex flex-wrap justify-between items-center mt-auto">
                              <div className="text-xs text-left">
                                {shift.hours
                                  ? `${shift.hours?.toFixed(1)}h`
                                  : ""}
                              </div>
                              <button
                                onClick={() => resetShift(widx, day)}
                                className="px-0.5 text-xs text-sky-600 hover:outline border rounded cursor-pointer"
                                title="Reset"
                              >
                                <ArrowPathIcon className="size-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td className="border-gray-400 border-0 p-2">
                  Total: <div>{weekTotalHours} hrs</div>
                </td>
                {days.map((day) => (
                  <td
                    key={day}
                    className="border-gray-400 border-l p-2 text-center"
                  >
                    {dailyTotals[day]?.toFixed(1) || "0.0"} hrs
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Daily Memo Editor */}
      <DailyMemoController
        workers={workers}
        dailyMemos={dailyMemos}
        updateDailyMemo={updateDailyMemo}
      />

      {/* Roster Summary Table */}
      <RosterSummary
        workers={workers}
        weeklyHours={weeklyHours}
        startTimes={startTimes}
        endTimes={endTimes}
        dailyMemos={dailyMemos}
        dailyHours={dailyTotals}
        weekDates={weekDates}
        rosterTitle={rosterTitle}
        rosterSubTitle={rosterSubTitle}
        calculateBreaks={calculateBreaks}
      />

      <div className="mt-5">
        {/* Gantt Chart Table */}
        <GanttChart
          workers={workers}
          startTimes={startTimes}
          endTimes={endTimes}
          generateTimeOptions={generateTimeOptions}
          timeToMinutes={timeToMinutes}
        />
      </div>

      <div className=""></div>
    </div>
  );
}
