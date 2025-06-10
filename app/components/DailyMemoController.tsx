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
    <div className="p-4 text-gray-800">
      <h2 className="font-semibold mb-2">Daily Memo Editor</h2>
      <table className="w-full border-0 text-sm table-fixed">
        <thead>
          <tr className="bg-gray-100">
            <th className="border-0 p-2" style={{ width: "120px" }}></th>
            {days.map((day) => (
              <th key={day} className="border-0 p-2 text-center" style={{}}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-t border-gray-300 p-2 bg-gray-50">
              Duty Supervisor
            </td>
            {days.map((day) => (
              <td key={day} className="border-t border-l border-gray-300 p-2">
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
            <td className="border-t border-gray-300 p-2 bg-gray-50">
              Oil Changer
            </td>
            {days.map((day) => (
              <td key={day} className="border-t border-l border-gray-300 p-2">
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
            <td className="border-t border-gray-300 p-2 bg-gray-50">
              Tray of Rice
            </td>
            {days.map((day) => (
              <td key={day} className="border-t border-l border-gray-300 p-2">
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
  );
}
