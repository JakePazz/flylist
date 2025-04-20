import type { Ttoast } from "$lib/types/toast";

let toastQueue: Ttoast[] = $state([]); // Queue to hold toasts
let currentToast: Ttoast | null = null; // Currently displayed toast
let onToastChange: (value: Ttoast | null) => void = () => {};

export function getToast() {
  function addToast(newToast: Ttoast) {
    toastQueue.push(newToast);
    processQueue();
  }

  function processQueue() {
    if (currentToast || toastQueue.length === 0) return; // If a toast is already being displayed, wait

    currentToast = toastQueue.shift()!; // Get the next toast from the queue
    if (onToastChange) {
      onToastChange(currentToast); // Notify the callback about the new toast
    }
    
    // I would like to thank chatgpt for gifting me this code

    // Automatically clear the current toast after its duration
    setTimeout(async () => {
      currentToast = null;

      // Wait for the transition animation
      await new Promise((resolve) => setTimeout(resolve, 350));

      processQueue();
    }, currentToast.type !== "error" ? 1500 : 5000); // info & success 2s, error 5s
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