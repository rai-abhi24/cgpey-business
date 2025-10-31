import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateUPI(upi: string) {
  return /^[\w.-]+@[\w]+$/.test(upi);
};