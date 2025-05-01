export type Tsettings = {
  preferences: Tpreferences,
  metar_api?: TmetarAPISettings,

  setup_complete?: boolean,
}

export type TmetarAPISettings = {
  key: string,
  // units?: {

  // }
}

type Tpreferences = {
  error_duration: number,
  info_success_duration: number,
  table_row_count: number,
}