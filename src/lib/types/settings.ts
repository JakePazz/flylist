import type { TmetarAPISettings } from "./metarAPISettings"
import type { Tpreferences } from "./preferences"

export type Tsettings = {
  preferences: Tpreferences,
  metar_api: TmetarAPISettings,
  setup_complete?: boolean,
}