import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * True when the user has just dragged to select text inside `container`.
 * Releasing the mouse after a selection fires a click, so clickable rows use
 * this to tell "I was copying a name" apart from "open this record".
 */
export function isSelectingTextIn(container: Node | null): boolean {
  if (typeof window === "undefined" || !container) return false;
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) return false;
  return container.contains(selection.anchorNode) || container.contains(selection.focusNode);
}
