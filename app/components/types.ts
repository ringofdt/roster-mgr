export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof days)[number];

export type Shift = {
  startTime: string;
  endTime: string;
  role: string;
  paidBreak: string;
  mealBreak: string;
  editable: boolean;
};

export type Worker = {
  name: string;
  title: string;
  remark: string;
  shifts: Record<Day, Shift>;
};

export type DailyMemo = {
  dutySupervisor: string;
  oilChanger: string;
  trayOfRice: number;
  remark: string;
};
