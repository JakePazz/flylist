import type { Tpreferences } from "$lib/types/preferences";
import type { Ttoast } from "$lib/types/toast";
import { load } from "@tauri-apps/plugin-store";

let toastQueue: Ttoast[] = $state([]); // Queue to hold toasts
let currentToast: Ttoast | null = null; // Currently displayed toast
let onToastChange: (value: Ttoast | null) => void = () => {};

export function getToast() {
  async function addToast(newToast: Ttoast) {
    toastQueue.push(newToast);
    await processQueue();
  }

  async function processQueue() {
    if (currentToast || toastQueue.length === 0) return; // If a toast is already being displayed, wait
  
    currentToast = toastQueue.shift()!; // Get the next toast from the queue
    if (onToastChange) {
      onToastChange(currentToast); // Notify the callback about the new toast
    }
  
    const settings = await load("settings.json");
    const preferences = await settings.get<Tpreferences>("preferences");
  
    let infoSuccessDuration = preferences?.info_success_duration || 1500;
    let errorDuration = preferences?.error_duration || 5000;
  
    // Automatically clear the current toast after its duration
    setTimeout(async () => {
      currentToast = null;
  
      // Wait for the transition animation to complete (e.g., 350ms)
      await new Promise((resolve) => setTimeout(resolve, 350));
  
      // Process the next toast in the queue
      await processQueue();
    }, currentToast.type !== "error" ? infoSuccessDuration : errorDuration);
  }

  function registerCallback(callback: (value: Ttoast | null) => void) {
    onToastChange = callback;
  }

  return {
    get value() {
      return currentToast;
    },
    addToast,
    registerCallback,
  };
}