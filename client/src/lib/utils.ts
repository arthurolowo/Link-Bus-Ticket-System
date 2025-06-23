import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string) {
  const numericAmount = typeof amount === 'string' ? parseInt(amount) : amount;
  return numericAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
