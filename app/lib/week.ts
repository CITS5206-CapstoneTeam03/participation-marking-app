type ConfigWeekLike = {
  id: string;
  weekNumber: number;
  label: string;
  enabled: boolean;
  locked: boolean;
};

export function getWeekNumberFromId(weekId: string): number | null {
  const match = /^week-(\d+)$/.exec(weekId);
  if (!match) return null;
  const weekNumber = Number(match[1]);
  return Number.isInteger(weekNumber) && weekNumber > 0 ? weekNumber : null;
}

export function getConfigWeekById<TWeek extends ConfigWeekLike>(weeks: TWeek[], weekId: string): TWeek | null {
  const weekNumber = getWeekNumberFromId(weekId);
  if (weekNumber === null) return null;
  return weeks.find((week) => week.weekNumber === weekNumber) ?? null;
}
