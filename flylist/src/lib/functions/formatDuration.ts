/**
 * Formats a `minutes` value into a string showing the hours and minutes
 * @param minutes
 * @returns Hours and minutes string
 */
export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours > 0 ? hours : ""}${hours > 0 ? "hr" : ""}${hours > 1 ? "s": ""} ${mins > 0 ? mins : "" }${mins > 0 ? "m" : "" }`;
}