import type { TunitPreferences } from "./unitPreferences";

export type Tpreferences = {
  table_row_count: number,
  duration_filter_button_interval: number,
  duration_filter_scroll_interval: number,
  toasts: {
    info_success_duration: number,
    error_duration: number,
  }
  units: TunitPreferences,
}