import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

/**
 * Format a timestamp as relative time ("just now", "5m ago", "3h ago").
 * Handles UTC timestamps from the backend that lack a timezone suffix
 * by appending "Z" so JavaScript parses them as UTC, not local time.
 */
export function formatRelativeTime(date: string | Date): string {
  let target: Date;
  if (typeof date === "string") {
    // Backend returns naive UTC timestamps like "2026-11-01T08:35:00"
    // without a Z suffix. Append Z so JS treats it as UTC.
    if (!date.endsWith("Z") && !date.includes("+") && !date.includes("-05") && !date.includes("-00")) {
      // Only append Z if it looks like a bare ISO timestamp without tz
      if (date.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
        target = new Date(date + "Z");
      } else {
        target = new Date(date);
      }
    } else {
      target = new Date(date);
    }
  } else {
    target = date;
  }

  const now = new Date();
  const diffMs = now.getTime() - target.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMs < 0) return "just now"; // future timestamp (clock skew)
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen) + "…";
}
