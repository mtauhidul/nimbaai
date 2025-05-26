// Add this to your existing frontend/lib/utils.js file

import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Utility function to safely convert Firestore timestamps to Date objects
export function toDate(timestamp) {
  if (!timestamp) return null;

  // If it's already a Date object
  if (timestamp instanceof Date) return timestamp;

  // If it's a Firestore Timestamp with toDate method
  if (timestamp.toDate && typeof timestamp.toDate === "function") {
    return timestamp.toDate();
  }

  // If it's a timestamp object with seconds/nanoseconds
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000);
  }

  // Try to parse as regular date
  try {
    return new Date(timestamp);
  } catch (error) {
    console.warn("Could not parse timestamp:", timestamp);
    return null;
  }
}

// Format date for display
export function formatDate(timestamp, options = {}) {
  const date = toDate(timestamp);
  if (!date) return "N/A";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  });
}

// Format datetime for display
export function formatDateTime(timestamp, options = {}) {
  const date = toDate(timestamp);
  if (!date) return "N/A";

  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}
