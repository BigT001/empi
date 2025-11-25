import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely format any date input to a readable format
 * Handles strings, Date objects, timestamps, and null values
 * @param dateInput - Date to format
 * @returns Formatted date string or "—" if invalid
 */
export function formatDate(dateInput: any, locale: string = "en-NG"): string {
  try {
    if (!dateInput) return "—";

    let date: Date | null = null;

    // Case 1: Already a Date object
    if (dateInput instanceof Date) {
      date = dateInput;
    }
    // Case 2: ISO string or date string
    else if (typeof dateInput === 'string') {
      // Handle ISO string with milliseconds
      const cleanDateStr = dateInput.split('.')[0];
      date = new Date(cleanDateStr);
    }
    // Case 3: Timestamp (number in milliseconds or seconds)
    else if (typeof dateInput === 'number') {
      // If it looks like seconds (small number), multiply by 1000
      date = new Date(dateInput > 10000000000 ? dateInput : dateInput * 1000);
    }
    // Case 4: Try generic conversion
    else {
      date = new Date(dateInput);
    }

    // Validate the date
    if (!date || isNaN(date.getTime())) {
      console.warn("Invalid date encountered:", dateInput);
      return "—";
    }

    // Format the date
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error("Date formatting error:", error, dateInput);
    return "—";
  }
}

/**
 * Format date with time
 */
export function formatDateTime(dateInput: any, locale: string = "en-NG"): string {
  try {
    if (!dateInput) return "—";

    let date: Date | null = null;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === 'string') {
      const cleanDateStr = dateInput.split('.')[0];
      date = new Date(cleanDateStr);
    } else if (typeof dateInput === 'number') {
      date = new Date(dateInput > 10000000000 ? dateInput : dateInput * 1000);
    } else {
      date = new Date(dateInput);
    }

    if (!date || isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error("DateTime formatting error:", error, dateInput);
    return "—";
  }
}

