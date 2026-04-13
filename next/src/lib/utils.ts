import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// cn() is the standard shadcn utility: merges Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
