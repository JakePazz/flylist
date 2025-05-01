import type { TmetarAPISettings } from "$lib/types/settings";
import { invoke } from '@tauri-apps/api/core';
import { load } from '@tauri-apps/plugin-store';
import { Store } from '@tauri-apps/plugin-store';

/**
 * Manages interactions with CheckWX API, found at: https://www.checkwxapi.com/
 */
export class MetarManager {
  private static store: Store | null = null;
  private static readonly CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  
  private static async getStore(): Promise<Store> {
    if (!this.store) {
      this.store = await load("metar_cache.json")
    }
    return this.store;
  }
  
  /**
   * Get the metar information for an airport via it's ICAO code with data cached for 30m before re-fetching
   * @param icao ICAO Code of airport to fetch METAR for
   * @param ignoreCache Set to true to force a new request
   * @returns
   */
  static async get(icao: string, ignoreCache: boolean = false) {
    try {
      const store = await this.getStore()
      const cacheKey = `metar_${icao}`

      if (!ignoreCache) {  
        // Check if cached version exists
        const cachedData = await store.get(cacheKey)
        if (cachedData) {
          const { timestamp, data } = cachedData as { timestamp: number, data: any }
          const currentTime = Date.now()
          
          // If the data is less than 30 minutes old, use it
          if (currentTime - timestamp < this.CACHE_DURATION_MS) {
            console.info(`Using cached METAR data for ${icao}`);
            return data
          }
        }
      }

      const apiKey = await this.getAPIKey()

      // Calls fetch_weather in backend and formats to send to metar_cache.json
      const data: string = await invoke('fetch_weather', { icao, apiKey })
      const parsedData = JSON.parse(data)["data"][0]
      parsedData["observed"] += "Z" // Add 'Z' to observed timestamps to JS recognises it as UTC not local time
      
      // Store in cache with timestamp
      await store.set(cacheKey, {
        timestamp: Date.now(),
        data: parsedData
      });
      
      // Save changes to disk
      await store.save()
      return parsedData;
    } catch (error) {
      console.error(`Error fetching weather data: ${error}`)
      throw error
    }
  }

  /**
   * Loop through cache and clear all expired items within the cache
   */
  static async cleanupCache() {
    try {
      const store = await this.getStore()
      const entries = await store.entries()
      const currentTime = Date.now()
      
      for (const [key, value] of entries) {
        if (key.startsWith('metar_')) {
          const { timestamp } = value as { timestamp: number, data: any }
          if (currentTime - timestamp >= this.CACHE_DURATION_MS) {
            await store.delete(key);
          }
        }
      }
      
      await store.save();
    } catch (error) {
      console.error(`Error cleaning up METAR cache: ${error}`)
      throw error
    }
  }

  /**
   * Delete the entire cache file by overwriting content to a blank file
   */
  static async deleteCache(): Promise<boolean> {
    try {
      await load("metar_cache.json", { createNew: true })

      return true
    } catch (error) {
      console.error(`Error deleting METAR cache ${error}`)
      throw error
    }
  }

  /**
   * Fetches the API Key from settings.json > metar_api > key; throws an error if no api key found
   * @return
   */
  private static async getAPIKey(): Promise<string> {
    const store = await load("settings.json")
    const metarPreferences = await store.get<TmetarAPISettings>("metar_api")

    if (!metarPreferences?.key) {
      throw "No API Key found in settings > metar_api > key"
    }

    return metarPreferences.key
  }

}