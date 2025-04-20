export function formatDate(date: Date) {
  return date.toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Use 12-hour format
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}