import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Select } from "@headlessui/react";
import {
  ArrowPathIcon,
  XCircleIcon,
  XMarkIcon,
  PlusCircleIcon,
  CursorArrowRaysIcon,
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
import {
  BadgeOpening,
  BadgeClosing,
  BadgePaidBreak,
  BadgeMealBreak,
} from "../components/Badges";

const defaultStartTimes: Record<Day, string> = {
  Mon: "07:30",
  Tue: "07:30",
  Wed: "07:30",
  Thu: "07:30",
  Fri: "07:30",
  Sat: "07:30",
  Sun: "08:30",
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

function getWeekStartDate(year: number, weekNumber: number): Date {
  const firstMonday = getFirstMondayOfJuly(year);
  const startDate = new Date(firstMonday);
  startDate.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
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

function getCurrentWeekInfo(): { year: number; week: number } {
  const today = new Date();
  const currentYear = today.getFullYear();

  // Check if we're before July (use previous year's numbering)
  if (today.getMonth() < 6) {
    // Before July
    const previousYear = currentYear - 1;
    const firstMonday = getFirstMondayOfJuly(previousYear);
    const diffTime = today.getTime() - firstMonday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    return { year: previousYear, week };
  } else {
    const firstMonday = getFirstMondayOfJuly(currentYear);
    const diffTime = today.getTime() - firstMonday.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const week = Math.floor(diffDays / 7) + 1;
    return { year: currentYear, week: Math.max(1, week) };
  }
}

export default function RosterApp(): React.JSX.Element {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [weeklyHours, setWeeklyHours] = useState<Record<string, number>>({});
  const [dailyTotals, setDailyTotals] = useState<Record<Day, number>>(
    Object.fromEntries(days.map((d) => [d, 0])) as Record<Day, number>,
  );

  const [newRole, setNewRole] = useState<string>("");

  const [roleList, setRoleList] = useState<string[]>(defaultRoleList);

  const [startTimes, setStartTimes] =
    useState<Record<Day, string>>(defaultStartTimes);
  const [endTimes, setEndTimes] =
    useState<Record<Day, string>>(defaultEndTimes);

  const [newWorkerName, setNewWorkerName] = useState<string>("");
  const [newWorkerTitle, setNewWorkerTitle] = useState<string>("");
  const [newWorkerRemark, setNewWorkerRemark] = useState<string>("");
  const [newWorkerDays, setNewWorkerDays] = useState<Record<Day, boolean>>(
    Object.fromEntries(days.map((d) => [d, true])) as Record<Day, boolean>,
  );

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

    setWeeklyHours(newWeeklyHours);
    setDailyTotals(newDailyTotals);
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
    field: "startTime" | "endTime" | "role",
    value: string,
  ) => {
    const updated = [...workers];
    // if (!updated[workerIndex].shifts[day].editable) return;
    updated[workerIndex].shifts[day][field] = value;
    const shift = updated[workerIndex].shifts[day];
    const hrs = calculateHours(shift.startTime, shift.endTime);
    updated[workerIndex].shifts[day]["mealBreak"] = hrs >= 5 ? "MB" : "";
    updated[workerIndex].shifts[day]["paidBreak"] = hrs >= 4 ? "PB" : "";

    setWorkers(updated);
  };

  const resetShift = (workerIndex: number, day: Day) => {
    const updated = [...workers];
    if (!updated[workerIndex].shifts[day].editable) return;
    updated[workerIndex].shifts[day] = {
      startTime: "",
      endTime: "",
      role: "",
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
      workers: workers,
      dailyMemos: dailyMemos,
      rosterInfo: {
        title: rosterTitle,
        subtitle: rosterSubTitle,
        year: currentWeekInfo.year,
        week: currentWeekInfo.week,
      },
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `roster-settings-${new Date().toISOString().split("T")[0]}.json`;

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
        }

        if (settings.dailyMemos) {
          setDailyMemos(settings.dailyMemos);
        }

        if (settings.rosterInfo) {
          setSelectedWeek(settings.rosterInfo.week);
          setSelectedYear(settings.rosterInfo.year);
          setRosterTitle(settings.rosterInfo.rosterTitle);
          setRosterSubTitle(settings.rosterInfo.rosterSubTitle);
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
        paidBreak: "",
        mealBreak: "",
        editable: false,
      };
    } else {
      updated[workerIndex].shifts[day] = {
        startTime: "",
        endTime: "",
        role: "",
        paidBreak: "",
        mealBreak: "",
        editable: true,
      };
    }
    setWorkers(updated);
  };

  return (
    <div className="p-3 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Team Roster Manager</h1>

      <div className="">
        <div className="p-2 space-y-4">
          <div className="flex flex-col gap-4 pb-4 border-b">
            <div className="">
              <div className="flex flex-col gap-2">
                <label className="font-semibold">Settings File</label>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={saveSettingsToFile}
                    className="flex items-center p-1 text-gray-600 hover:outline border rounded cursor-pointer"
                  >
                    <span>Save Settings</span>
                  </button>
                  <div
                    className=" flex-1 justify-center rounded-lg w-80% border border-dashed border-gray-900/25 px-3 py-2 bg-gray-200 hover:bg-gray-100 transition-colors"
                    onDrop={handleSettingsDrop}
                    onDragOver={handleSettingsDragOver}
                  >
                    <div className="flex text-sm/6 text-gray-600">
                      <label
                        htmlFor="settings-file-input"
                        className="relative "
                      >
                        <span className="p-1 hover:outline border rounded cursor-pointer">
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
                      </label>
                      <span className="pl-1">or drag and drop</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex  gap-2 justify-between">
              <div className="flex flex-col gap-1 ">
                <label className="font-semibold">Roles</label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new role"
                    value={newRole}
                    className="border rounded px-2 py-1"
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
                  />
                  <button
                    className="flex gap-1 items-center px-2 py-1 text-gray-600 hover:outline border rounded cursor-pointer"
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
                    <PlusCircleIcon className="size-5" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
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
              <div className=" gap-1">
                <label className="font-semibold">Day Time Shifts</label>
                <div className="flex flex-col md:flex-row gap-1">
                  {days.map((day) => (
                    <div
                      key={day}
                      className="flex items-center md:flex-col gap-1 text-sm"
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
                        className="w-full border rounded px-1 py-1"
                      />
                      <input
                        type="time"
                        value={endTimes[day]}
                        onChange={(e) =>
                          setEndTimes({ ...endTimes, [day]: e.target.value })
                        }
                        className="w-full border rounded px-1 py-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Input */}
      <div className="">
        <div className="p-2">
          <h2 className="font-semibold">New Member</h2>
          <div className="grid grid-cols-3 gap-2">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Name"
                value={newWorkerName}
                onChange={(e) => setNewWorkerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addWorkerRow();
                  }
                }}
                className="border rounded px-2 py-1 w-80"
              />
              <button
                onClick={addWorkerRow}
                className="flex gap-1 items-center px-2 py-1 text-gray-600 hover:outline border rounded cursor-pointer"
              >
                <PlusCircleIcon className="size-5" />
                <span>Add</span>
              </button>
            </div>
            <div className="col-span-2 flex flex-row gap-2">
              {days.map((day) => (
                <label
                  key={day}
                  className="px-1 border rounded items-center flex border-gray-400"
                >
                  <input
                    type="checkbox"
                    checked={newWorkerDays[day]}
                    onChange={() => toggleDayForNewWorker(day)}
                    className="mr-1"
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 grid grid-cols-1 gap-6">
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-row gap-1">
            <div className="">
              <label className="block text-xs px-1">&nbsp;</label>
              <button
                onClick={() => {
                  const current = getCurrentWeekInfo();
                  setSelectedYear(current.year);
                  setSelectedWeek(current.week + 1);
                }}
                className="flex gap-1 items-center px-2 py-1 text-gray-600 cursor-pointer border rounded hover:outline"
              >
                <CursorArrowRaysIcon className="size-5" />
                <span className="font-light"> Next Week</span>
              </button>
            </div>
            <div className="">
              <label className="block text-xs px-1">Year</label>
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
                className="border rounded px-2 py-1 w-full"
              />
            </div>
            <div>
              <label className="block text-xs px-1">Week</label>
              <input
                type="number"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(parseInt(e.target.value) || 1)}
                min="1"
                max="53"
                className="border rounded px-2 py-1 w-16"
              />
            </div>
          </div>
          <div className="">
            <label className="block text-xs px-1">Title</label>
            <input
              type="text"
              placeholder=""
              value={rosterTitle}
              onChange={(e) => setRosterTitle(e.target.value)}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
          <div className="">
            <label className="block text-xs px-1">Subtitle</label>
            <input
              type="text"
              placeholder=""
              value={rosterSubTitle}
              onChange={(e) => setRosterSubTitle(e.target.value)}
              className="border rounded px-2 py-1 w-full"
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
                          ? `${weeklyHours[worker.name].toFixed(1)} hrs`
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
                          className="border-gray-400 border-l border-b p-2 align-top"
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
                            <div className="grid gap-1 mb-3">
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
                                  className="w-full px-0"
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
                                  className="w-full px-0"
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
                            </div>
                          </div>

                          {/* Bottom row - always at the bottom */}
                          <div className="flex justify-between items-center mt-auto">
                            <div className="flex gap-0.5 items-center">
                              <div className="text-xs text-left px-0.5">
                                {shift.startTime && shift.endTime
                                  ? `${calculateHours(shift.startTime, shift.endTime).toFixed(1)}h`
                                  : ""}
                              </div>
                              {shift.paidBreak && <BadgePaidBreak />}
                              {shift.mealBreak && <BadgeMealBreak />}
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
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-semibold">
                <td className="border-gray-400 border-0 p-2">Total Hrs</td>
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
        weekDates={weekDates}
        rosterTitle={rosterTitle}
        rosterSubTitle={rosterSubTitle}
        calculateHours={calculateHours}
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
