import type { TunitPreferences } from "./unitPreferences";

export type Tpreferences = {
  table_row_count: number,
  toasts: {
    info_success_duration: number,
    error_duration: number,
  }
  units: TunitPreferences,
}