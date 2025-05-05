import { Store, load } from "@tauri-apps/plugin-store";
import type { Tpreferences } from "$lib/types/preferences";
import type { TmetarAPISettings } from "$lib/types/metarAPISettings";

export class SettingsManager {

  // Default values
  private static readonly DEFAULT_PREFERENCES: Tpreferences = {
    table_row_count: 10,
    toasts: {
      info_success_duration: 1500,
      error_duration: 5000,
    },
    units: {
      altitude: "feet",
      barometer: "hpa",
      general_distance: "metric",
      precipitation_measurement: "metric",
      wind_speed: "kts",
      temperature: "celsius",
    }
  }

  private static readonly DEFAULT_METAR_SETTINGS: TmetarAPISettings = {
      cacheOutdatedAgeMinutes: 30
  }

  /**
   * Helper function - manages loading and closing of settings store
   * @param operation - Function that performs store operations
   * @returns Promise resolving to the result of the operation
   */
  private static async withStore<T>(operation: (store: Store) => Promise<T>): Promise<T> {
    const store = await load("settings.json")
    
    try {
      return await operation(store)
    } catch (error) {
      console.error("Settings store operation failed:", error)
      throw new Error(`Error during settings operation: ${error}`)
    }
  }

  /**
   * Get user preferences from settings
   * @returns Promise containing the preferences object
   */
  static async getPreferences(): Promise<Tpreferences> {
    return this.withStore(async (store) => {
      const preferences = await store.get<Tpreferences>("preferences")
      return preferences || {...this.DEFAULT_PREFERENCES}
    });
  }

  /**
   * Save user preferences to settings
   * @param preferences The preferences object to save
   * @returns Promise resolving to true if successful
   */
  static async savePreferences(preferences: Tpreferences): Promise<boolean> {
    return this.withStore(async (store) => {
      await store.set("preferences", preferences)
      await store.save()
      return true
    });
  }

  /**
   * Get METAR API settings
   * @returns Promise containing the METAR API settings
   */
  static async getMetarAPISettings(): Promise<TmetarAPISettings> {
    return this.withStore(async (store) => {
      const metarSettings = await store.get<TmetarAPISettings>("metar_api")

      return metarSettings || {...this.DEFAULT_METAR_SETTINGS}
    });
  }

  /**
   * Save METAR API settings
   * @param settings The METAR API settings to save
   * @returns Promise resolving to true if successful
   */
  static async saveMetarAPISettings(settings: TmetarAPISettings): Promise<boolean> {
    return this.withStore(async (store) => {
      await store.set("metar_api", settings)
      await store.save()
      return true
    });
  }

  /**
   * Get any value from settings by key with optional default value
   * @param key The settings key to retrieve
   * @param defaultValue Optional default value if the key doesn't exist
   * @returns Promise containing the value for the given key
   */
  static async getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return this.withStore(async (store) => {
      const value = await store.get<T>(key)
      return value !== null && value !== undefined ? value : defaultValue
    });
  }

  /**
   * Save any value to settings by key
   * @param key The settings key to save under
   * @param value The value to save
   * @returns Promise resolving to true if successful
   */
  static async saveSetting<T>(key: string, value: T): Promise<boolean> {
    return this.withStore(async (store) => {
      await store.set(key, value)
      await store.save()
      return true
    });
  }

  /**
   * Get all settings at once
   * @returns Complete settings object
   */
  static async getAllSettings(): Promise<{
    preferences: Tpreferences,
    metar_api: TmetarAPISettings,
    setup_complete: boolean
  }> {
    return this.withStore(async (store) => {
      const allEntries = await store.entries();
      const settings = Object.fromEntries(allEntries);
      
      return {
        preferences: settings.preferences as Tpreferences || {...this.DEFAULT_PREFERENCES},
        metar_api: settings.metar_api as TmetarAPISettings || {...this.DEFAULT_METAR_SETTINGS},
        setup_complete: settings.setup_complete as boolean || false
      };
    });
  }

  /**
   * Check if setup is complete
   */
  static async isSetupComplete(): Promise<boolean> {
    return this.withStore(async (store) => {
      const setupComplete = await store.get<boolean>("setup_complete")
      return setupComplete === true
    });
  }

  /**
   * Mark setup as complete
   */
  static async markSetupComplete(): Promise<void> {
    return this.withStore(async (store) => {
      await store.set("setup_complete", true)
      await store.save()
    });
  }
}