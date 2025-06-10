import React from "react";
import { type Worker, type Day, type DailyMemo, days } from "./types";

interface DailyMemoProps {
  workers: Worker[];
  dailyMemos: Record<Day, DailyMemo>;
  updateDailyMemo: (
    day: Day,
    field: keyof DailyMemo,
    value: string | number,
  ) => void;
}

export function DailyMemoController({
  workers,
  dailyMemos,
  updateDailyMemo,
}: DailyMemoProps) {
  return (
    <div className="mb-6">
      <div className="p-4 overflow-auto">
        <h2 className="font-semibold mb-2">Daily Memo</h2>
        <table className="w-full border text-sm table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2" style={{ width: "135px" }}>
                Information
              </th>
              {days.map((day) => (
                <th
                  key={day}
                  className="border p-1 text-center"
                  style={{ width: "135px" }}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border-r border-b p-2 align-middle font-semibold bg-gray-50">
                Duty Supervisor
              </td>
              {days.map((day) => (
                <td key={day} className="border-r border-b p-2">
                  <select
                    value={dailyMemos[day].dutySupervisor}
                    onChange={(e) =>
                      updateDailyMemo(day, "dutySupervisor", e.target.value)
                    }
                    className="w-full border rounded px-2 py-1 bg-white"
                  >
                    <option value=""></option>
                    {workers.map((worker, idx) => (
                      <option key={idx} value={worker.name}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
            <tr>
              <td className="border-r border-b p-2 align-middle font-semibold bg-gray-50">
                Oil Changer
              </td>
              {days.map((day) => (
                <td key={day} className="border-r border-b p-2">
                  <select
                    value={dailyMemos[day].oilChanger}
                    onChange={(e) =>
                      updateDailyMemo(day, "oilChanger", e.target.value)
                    }
                    className="w-full border rounded px-2 py-1 bg-white"
                  >
                    <option value=""></option>
                    {workers.map((worker, idx) => (
                      <option key={idx} value={worker.name}>
                        {worker.name}
                      </option>
                    ))}
                  </select>
                </td>
              ))}
            </tr>
            <tr>
              <td className="border-r border-b p-2 align-middle font-semibold bg-gray-50">
                Tray of Rice
              </td>
              {days.map((day) => (
                <td key={day} className="border-r border-b p-2">
                  <input
                    type="number"
                    step="0.5"
                    value={dailyMemos[day].trayOfRice || ""}
                    onChange={(e) =>
                      updateDailyMemo(
                        day,
                        "trayOfRice",
                        parseFloat(e.target.value) || 0.0,
                      )
                    }
                    min="0"
                    className="w-full border rounded px-2 py-1"
                    placeholder="0"
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
