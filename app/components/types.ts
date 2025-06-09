export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof days)[number];

export type Shift = {
  startTime: string;
  endTime: string;
  role: string;
  editable: boolean;
};

export type Worker = {
  name: string;
  shifts: Record<Day, Shift>;
};
